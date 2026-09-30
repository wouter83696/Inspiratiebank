/* Run against a local server: DISCOVERY_BASE_URL=http://127.0.0.1:8765 node this-file.
   CI installs Playwright; CHROME_CHANNEL=chrome uses an installed Chrome locally. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const base=process.env.DISCOVERY_BASE_URL || 'http://127.0.0.1:8765';
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_CHANNEL?{channel:process.env.CHROME_CHANNEL}:{})});
 try {
 const context=await browser.newContext({viewport:{width:1440,height:1000}});
 await context.route('**/*',r=>r.request().url().startsWith(base+'/')?r.continue():r.abort());
 const pages=[],errors=[];
 for(const path of ['/','/beheer/#inspiration']){
   const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
   await page.goto(base+path);await page.waitForFunction(()=>!document.documentElement.classList.contains('appLoading'),{},{timeout:90000});
   if(path.includes('beheer'))await page.evaluate(()=>showAdmin());
   pages.push(page);console.log('Loaded',path);
 }
 const styles=async(page,selector)=>page.locator(selector).evaluateAll(nodes=>nodes.map(el=>{
   const css=getComputedStyle(el);return Object.fromEntries(['fontFamily','fontSize','fontWeight','lineHeight','padding','margin','color','backgroundColor','borderRadius','borderWidth','display','gap','boxSizing'].map(key=>[key,css[key]]));
 }));
 for(const width of [1440,390]){
   console.log('Checking viewport',width);
   for(const page of pages)await page.setViewportSize({width,height:1000});
   for(const selector of ['#ideaSearch','#filterToggle','#inspirationThemeLegend [data-theme-filter]']){
     assert.deepEqual(await styles(pages[0],selector),await styles(pages[1],selector),`${width}: ${selector}`);
   }
   for(const page of pages){
     await page.locator('#ideaSearch').fill('Beatmaking');
     assert(await page.locator('#ideaSearchSuggestions [data-search-suggestion]').count()>0,'shared autocomplete');
     await page.locator('#ideaSearch').press('Escape');await page.locator('#ideaSearch').fill('');
     if(width>640)await page.locator('#inspirationDesktopLocation [data-filter-settings-btn]').click();
     else await page.locator('#filterToggle').click();
     await page.locator('#ideaFilterSheetLayer.isOpen').waitFor();
   }
   assert.deepEqual(await styles(pages[0],'#ideaFilterSheetLayer *'),await styles(pages[1],'#ideaFilterSheetLayer *'),`${width}: complete filter sheet`);
   for(const page of pages){
     await page.locator('#ideaFilterCategoryChips button').nth(1).click();
     await page.locator('#ideaFilterCategoryChips button').nth(2).click();
     assert.equal(await page.locator('#ideaFilterCategoryChips [aria-pressed="true"]').count(),2);
     await page.locator('#ideaFilterDistanceRange').fill('3');
     assert.equal(await page.locator('#ideaFilterDistanceValue').innerText(),'15 km');
     await page.locator('#ideaFilterClearBtn').click();
     assert.equal(await page.locator('#ideaFilterDistanceValue').innerText(),'10 km');
     await page.locator('#ideaFilterSheetLayer .ideaFilterSheetClose').press('Escape');
     assert.equal(await page.locator('#ideaFilterSheetLayer').getAttribute('aria-hidden'),'true');
     assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${width}: no page overflow`);
   }
 }
 const admin=pages[1];await admin.setViewportSize({width:1440,height:1000});
 await admin.locator('.desktopViewBar [data-admin-view="list"]').click();
 const row=admin.locator('#adminIdeaList tbody tr').first();await row.locator('td').nth(2).click();
 assert.equal(await row.getAttribute('aria-pressed'),'true');
 assert(await admin.locator('#ideaSelectionActions [data-edit-idea]').isVisible());
 assert(await admin.locator('.featuredAdminPanel').getAttribute('open')!==null);
 await admin.screenshot({path:'/tmp/discovery-admin-verified.png'});
 assert.deepEqual(errors,[]);
 console.log('PASS: identical search/category/sheet styles at 1440px and 390px; autocomplete, categories, distance, reset, Escape, list selection and toolbar.');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
