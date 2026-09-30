/* Compare actual browser output: shared markup alone does not prove CSS parity. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const base=process.env.DISCOVERY_BASE_URL||'http://127.0.0.1:8765';
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_CHANNEL?{channel:process.env.CHROME_CHANNEL}:{})});
 try{
  const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
 context.setDefaultTimeout(60000);
  await context.route('**/*',r=>r.request().url().startsWith(base+'/')?r.continue():r.abort());
  await require('./admin-fixture.cjs')(context,base);
  const pages=[],errors=[];
  for(const path of ['/','/beheer/#agenda']){
   const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto(base+path);
   await p.waitForFunction(()=>!document.documentElement.classList.contains('appLoading'),{},{timeout:90000});
   await p.evaluate(admin=>admin?showAdmin():setTab('weken'),path.includes('beheer'));pages.push(p);
  }
  const style=async(p,s)=>p.locator(s).evaluateAll(es=>es.map(e=>{const c=getComputedStyle(e);return Object.fromEntries(['fontFamily','fontSize','fontWeight','lineHeight','padding','color','backgroundColor','borderRadius','borderWidth','display','gap','boxSizing'].map(k=>[k,c[k]]))}));
  for(const width of [1440,820,390]){
   console.log('Agenda viewport',width);
   for(const p of pages){await p.setViewportSize({width,height:1000});await p.waitForFunction(w=>innerWidth===w,width);await p.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));}
   for(const s of ['#agendaSearch','#agendaFilterToggle','#agendaThemeLegend [data-theme-filter]','.agendaSectionTab','.weekBadge','.weekTop h3','.weekHeaderMeta .weekCountBadge','.agendaHead','.agendaItemMeta']){
    assert.deepEqual(await style(pages[1],s),await style(pages[0],s),`${width}: ${s}`);
   }
   for(const p of pages){
    console.log('Search and sheet',width,p===pages[0]?'public':'admin');
    const title=await p.locator('.agendaItemTitle .ideaTitleText').first().textContent();
    await p.locator('#agendaSearch').fill(title);assert(await p.locator('.agendaItem').count()>0);
    await p.locator('#agendaSearch').fill('no-match-unique-test');assert.equal(await p.locator('.agendaItem').count(),0);
    await p.locator('#agendaSearch').fill('');
    const expand=p.locator('[data-expand-agenda-day]').first();await expand.click();assert.equal(await p.locator('.agendaItem').count(),6);await p.locator('[data-collapse-agenda-day]').first().click();
    if(width>640)await p.locator('#agendaDesktopLocation [data-filter-settings-btn]').click();else await p.locator('#agendaFilterToggle').click();
    await p.locator('#agendaFilterSheetLayer.isOpen').waitFor();
    await p.locator('#agendaFilterSheetLayer').evaluate(async e=>{await Promise.all(e.getAnimations({subtree:true}).map(a=>a.finished.catch(()=>{})))});
   }
   for(const s of ['.ideaFilterSheet','.ideaFilterSheetHeader','.ideaFilterLocationField','.ideaFilterRange','#agendaFilterCategoryChips button','#agendaFilterWeekChips button','#agendaFilterPriceChips button']){
    assert.deepEqual(await style(pages[1],'#agendaFilterSheetLayer '+s),await style(pages[0],'#agendaFilterSheetLayer '+s),`${width}: sheet ${s}`);
   }
   for(const p of pages){
    console.log('Filter and navigation',width,p===pages[0]?'public':'admin');
    await p.locator('#agendaFilterCategoryChips button').nth(1).click();
    assert.equal(await p.locator('#agendaFilterCategoryChips [aria-pressed="true"]').count(),1);
    await p.locator('#agendaFilterDistanceRange').fill('2');assert.equal(await p.locator('#agendaFilterDistanceValue').innerText(),'10 km');
    await p.locator('#agendaFilterClearBtn').click();assert.equal(await p.locator('#agendaFilterDistanceValue').innerText(),'25 km');
    await p.locator('#agendaFilterWeekChips [data-value="w40"]').click();
    await p.locator('#agendaFilterSheetLayer .ideaFilterSheetClose').click();
    assert.equal(await p.locator('#agendaFilterSheetLayer').getAttribute('aria-hidden'),'true');
    await p.locator('#agenda-tab-ongoing').click();assert(await p.locator('.ongoingAccordion:visible').isVisible());await p.locator('.ongoingAccordion:visible').screenshot({path:`/tmp/ongoing-${p===pages[0]?'public':'admin'}-${width}.png`});
    await p.locator('#agenda-tab-weeks').click();assert(await p.locator('.weekPanel').first().isVisible());
    if(width>640){
     await p.locator('[aria-label="Volgende week"]').click();assert.equal(await p.locator('#agendaWeekFilter').inputValue(),'w41');
     await p.locator('[aria-label="Vorige week"]').click();
    }else{
     for(const week of ['w41','w40']){
      await p.locator('[data-select-id="agendaWeekFilter"] .customSelectButton').click();
      await p.locator(`[data-select-id="agendaWeekFilter"] [data-value="${week}"]`).click();
      assert.equal(await p.locator('#agendaWeekFilter').inputValue(),week);
     }
     await p.locator('[data-agenda-day-target="w40:2026-09-30"]').click();
     assert.equal(await p.locator('[data-agenda-day-target="w40:2026-09-30"]').getAttribute('aria-current'),'date');
    }
    assert.equal(await p.locator('#agendaWeekFilter').inputValue(),'w40');
    assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${width}: no overflow`);
    await p.screenshot({path:`/tmp/agenda-${p===pages[0]?'public':'admin'}-${width}.png`});
   }
  }
  const admin=pages[1];await admin.setViewportSize({width:1440,height:1000});
  await admin.locator('.adminAgendaManagementFilters>summary').click();assert(await admin.locator('.adminAgendaManagementFilters').evaluate(e=>e.open),'management disclosure opens');await admin.locator('.adminAgendaManagementFilters>summary').click();assert(!await admin.locator('.adminAgendaManagementFilters').evaluate(e=>e.open),'management disclosure closes');
  await admin.locator('.agendaItem').first().click();assert(await admin.locator('#agendaSelectionActions [data-edit-agenda]').isVisible());assert.equal(await admin.locator('.agendaItem.isSelected').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(246, 239, 223)');
  await admin.locator('[data-admin-scroll="ongoingAdminSection"]').click();assert(await admin.locator('#ongoingAdminSection').isVisible());
  await admin.locator('[data-admin-scroll="sourceOwnPanel"]').click();assert(await admin.locator('#sourceOwnPanel').isVisible());
  await admin.locator('[data-admin-scroll="agendaRulesPanel"]').click();assert(await admin.locator('#agendaRulesPanel').isVisible());
  await admin.locator('[data-admin-scroll="agendaAdminSection"]').click();assert(await admin.locator('#agendaReviewList').isVisible());assert(!await admin.locator('#sourceOwnPanel').isVisible());assert(!await admin.locator('#agendaRulesPanel').isVisible());
  assert.deepEqual(errors,[]);console.log('PASS agenda: desktop/tablet/mobile style parity, search, filters, radius/reset, week and section navigation, selection toolbar and sidebar.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
