const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ctx={window:{},URL};vm.createContext(ctx);vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../site-settings-shared.js'),'utf8'),ctx);
test('featured settings keep defaults for existing sites and validate saved values',()=>{
 const normalize=ctx.window.SiteSettings.normalize;
 assert.equal(normalize().featuredAutoplay,true);assert.equal(normalize().featuredIntervalSeconds,7);
 for(const delay of [5,7,10,15])assert.equal(normalize({featuredIntervalSeconds:delay,featuredAutoplay:false}).featuredIntervalSeconds,delay);
 assert.equal(normalize({featuredAutoplay:false}).featuredAutoplay,false);
 for(const invalid of [0,-1,300,'10',null])assert.equal(normalize({featuredIntervalSeconds:invalid}).featuredIntervalSeconds,7);
});
test('photo tile presentation defaults on and can be reverted independently',()=>{
 const normalize=ctx.window.SiteSettings.normalize;
 assert.equal(normalize().photoTiles,true);
 assert.equal(normalize({photoTiles:false}).photoTiles,false);
 assert.equal(normalize({photoTiles:false,featuredAutoplay:false}).featuredAutoplay,false);
 assert.equal(normalize({photoTiles:true}).photoTiles,true);
});
test('compact style is the default and all three styles remain selectable',()=>{
 const normalize=ctx.window.SiteSettings.normalize;
 assert.equal(normalize().tileStyle,'compact');
 assert.equal(normalize({photoTiles:false}).tileStyle,'classic');
 for(const tileStyle of ['compact','photo','classic'])assert.equal(normalize({tileStyle}).tileStyle,tileStyle);
 assert.equal(normalize({tileStyle:'invalid'}).tileStyle,'compact');
});
