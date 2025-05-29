import asyncio
from playwright.async_api import async_playwright
import os
import sys

async def test_theme_switching():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        page = await context.new_page()
        
        # Set viewport size for desktop testing
        await page.set_viewport_size({"width": 1920, "height": 1080})
        
        try:
            # Navigate to the application
            print("Navigating to the application...")
            await page.goto("https://af267735-92eb-4cf3-b052-dff209029be0.preview.emergentagent.com/")
            await page.wait_for_selector("text=sync.fm", timeout=10000)
            print("✅ Page loaded successfully")
            
            # Test 1: Locate and activate theme switcher
            print("\n🔍 Test 1: Locate and activate theme switcher")
            theme_switcher = await page.wait_for_selector('button[title="Change Theme"]')
            if theme_switcher:
                print("✅ Theme switcher button found")
            else:
                print("❌ Theme switcher button not found")
                return 1
            
            await theme_switcher.click()
            print("✅ Clicked theme switcher button")
            
            # Wait for the theme dropdown to appear
            theme_dropdown = await page.wait_for_selector('text=Choose Theme')
            if theme_dropdown:
                print("✅ Theme dropdown opened")
            else:
                print("❌ Theme dropdown did not open")
                return 1
            
            # Verify all 4 theme options are visible with descriptions
            theme_options = await page.query_selector_all('.w-full.flex.items-center.space-x-3')
            print(f"Found {len(theme_options)} theme options")
            
            if len(theme_options) == 4:
                print("✅ All 4 theme options are visible")
            else:
                print("❌ Not all theme options are visible")
            
            # Test 2: Test each theme with visual changes
            print("\n🔍 Test 2: Test each theme with visual changes")
            
            # First, verify we're on Cyberpunk theme (default)
            cyberpunk_text = await page.evaluate('() => document.documentElement.className')
            print(f"Current theme class: {cyberpunk_text}")
            
            if "theme-cyber" in cyberpunk_text:
                print("✅ Default theme is Cyberpunk as expected")
            else:
                print("❌ Default theme is not Cyberpunk")
            
            # Take screenshot of Cyberpunk theme
            await page.screenshot(path="cyberpunk_theme.png", quality=40, full_page=False)
            print("📸 Cyberpunk theme screenshot captured")
            
            # Check specific visual elements for Cyberpunk theme
            logo_color = await page.evaluate('''() => {
                const logo = document.querySelector('text=sync.fm');
                if (logo) {
                    return getComputedStyle(logo).color;
                }
                return null;
            }''')
            print(f"Logo color in Cyberpunk theme: {logo_color}")
            
            # Switch to Dark theme
            await theme_switcher.click()
            await page.wait_for_selector('text=Choose Theme')
            dark_theme = await page.query_selector('text=Dark Mode')
            await dark_theme.click()
            print("Switched to Dark theme")
            
            # Wait for theme to apply
            await page.wait_for_timeout(1000)
            
            # Take screenshot of Dark theme
            await page.screenshot(path="dark_theme.png", quality=40, full_page=False)
            print("📸 Dark theme screenshot captured")
            
            # Verify Dark theme is applied
            dark_theme_class = await page.evaluate('() => document.documentElement.className')
            if "theme-dark" in dark_theme_class:
                print("✅ Dark theme applied successfully")
            else:
                print("❌ Dark theme not applied")
            
            # Switch to Light theme
            await theme_switcher.click()
            await page.wait_for_selector('text=Choose Theme')
            light_theme = await page.query_selector('text=Light Mode')
            await light_theme.click()
            print("Switched to Light theme")
            
            # Wait for theme to apply
            await page.wait_for_timeout(1000)
            
            # Take screenshot of Light theme
            await page.screenshot(path="light_theme.png", quality=40, full_page=False)
            print("📸 Light theme screenshot captured")
            
            # Verify Light theme is applied
            light_theme_class = await page.evaluate('() => document.documentElement.className')
            if "theme-light" in light_theme_class:
                print("✅ Light theme applied successfully")
            else:
                print("❌ Light theme not applied")
            
            # Check background color for Light theme
            bg_color = await page.evaluate('() => getComputedStyle(document.body).backgroundColor')
            text_color = await page.evaluate('() => getComputedStyle(document.body).color')
            print(f"Background color in Light theme: {bg_color}")
            print(f"Text color in Light theme: {text_color}")
            
            # Check if Light theme has dramatic visual differences
            is_light_bg = await page.evaluate('''() => {
                const bgColor = getComputedStyle(document.body).backgroundColor;
                // Parse RGB values
                const match = bgColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
                if (match) {
                    const [r, g, b] = [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
                    // Check if colors are light (high values)
                    return r > 200 && g > 200 && b > 200;
                }
                return false;
            }''')
            
            if is_light_bg:
                print("✅ Light theme has bright background")
            else:
                print("❌ Light theme does not have bright background")
            
            # Switch to Matrix theme
            await theme_switcher.click()
            await page.wait_for_selector('text=Choose Theme')
            matrix_theme = await page.query_selector('text=Matrix')
            await matrix_theme.click()
            print("Switched to Matrix theme")
            
            # Wait for theme to apply
            await page.wait_for_timeout(1000)
            
            # Take screenshot of Matrix theme
            await page.screenshot(path="matrix_theme.png", quality=40, full_page=False)
            print("📸 Matrix theme screenshot captured")
            
            # Verify Matrix theme is applied
            matrix_theme_class = await page.evaluate('() => document.documentElement.className')
            if "theme-matrix" in matrix_theme_class:
                print("✅ Matrix theme applied successfully")
            else:
                print("❌ Matrix theme not applied")
            
            # Check text color for Matrix theme
            matrix_text_color = await page.evaluate('() => getComputedStyle(document.body).color')
            print(f"Text color in Matrix theme: {matrix_text_color}")
            
            # Test 3: Theme persistence
            print("\n🔍 Test 3: Theme persistence")
            
            # Refresh the page while on Matrix theme
            await page.reload()
            await page.wait_for_selector("text=sync.fm", timeout=10000)
            print("Page reloaded")
            
            # Check if Matrix theme persisted
            matrix_persisted = await page.evaluate('() => document.documentElement.className')
            print(f"Theme class after refresh: {matrix_persisted}")
            
            if "theme-matrix" in matrix_persisted:
                print("✅ Matrix theme persisted after page refresh")
            else:
                print("❌ Matrix theme did not persist after refresh")
            
            # Check localStorage to see if theme is being saved
            local_storage_theme = await page.evaluate('() => localStorage.getItem("sync-theme")')
            print(f"Theme in localStorage: {local_storage_theme}")
            
            # Switch to Light theme and test persistence again
            await theme_switcher.click()
            await page.wait_for_selector('text=Choose Theme')
            light_theme = await page.query_selector('text=Light Mode')
            await light_theme.click()
            print("Switched to Light theme")
            
            # Wait for theme to apply
            await page.wait_for_timeout(1000)
            
            # Refresh the page
            await page.reload()
            await page.wait_for_selector("text=sync.fm", timeout=10000)
            print("Page reloaded")
            
            # Check if Light theme persisted
            light_persisted = await page.evaluate('() => document.documentElement.className')
            print(f"Theme class after refresh: {light_persisted}")
            
            if "theme-light" in light_persisted:
                print("✅ Light theme persisted after page refresh")
            else:
                print("❌ Light theme did not persist after refresh")
            
            # Test 4: Theme consistency across pages
            print("\n🔍 Test 4: Theme consistency across pages")
            
            # Navigate to Swap page
            swap_link = await page.query_selector('text=SWAP')
            if swap_link:
                await swap_link.click()
                print("Navigated to Swap page")
                
                # Wait for page to load
                await page.wait_for_timeout(2000)
                
                # Take screenshot of Swap page
                await page.screenshot(path="swap_page_theme.png", quality=40, full_page=False)
                print("📸 Swap page screenshot captured")
                
                # Check theme on Swap page
                swap_theme_class = await page.evaluate('() => document.documentElement.className')
                print(f"Theme class on Swap page: {swap_theme_class}")
                
                # Navigate to Portfolio page
                portfolio_link = await page.query_selector('text=PORTFOLIO')
                if portfolio_link:
                    await portfolio_link.click()
                    print("Navigated to Portfolio page")
                    
                    # Wait for page to load
                    await page.wait_for_timeout(2000)
                    
                    # Take screenshot of Portfolio page
                    await page.screenshot(path="portfolio_page_theme.png", quality=40, full_page=False)
                    print("📸 Portfolio page screenshot captured")
                    
                    # Check theme on Portfolio page
                    portfolio_theme_class = await page.evaluate('() => document.documentElement.className')
                    print(f"Theme class on Portfolio page: {portfolio_theme_class}")
            
            print("\n📊 Theme switching test completed")
            
        except Exception as e:
            print(f"❌ Error during testing: {str(e)}")
            # Take screenshot on error
            await page.screenshot(path="error_screenshot.png", quality=40, full_page=False)
            return 1
        finally:
            await browser.close()
        
        return 0

if __name__ == "__main__":
    asyncio.run(test_theme_switching())
