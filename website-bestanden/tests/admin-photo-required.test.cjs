const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../../beheer/index.html'),'utf8');
const code=source.slice(source.indexOf('  async function submitAdminIdeaEdit('),source.indexOf('async function verifyAdminPassword('));
for(const [image,approved] of [['',true],['photo.jpg',false]]){
 test(`missing or unapproved photo blocks storage (${image||'empty'}, ${approved})`,async()=>{
  let status='',touched=false;
  const ctx={editingAdminIdea:{key:'test'},editedIdeaPayload:()=>({title:'Test'}),$:id=>id==='#adminEditIdeaImage'?{value:image}:{checked:approved},setStatus:(_,text)=>status=text,document:{querySelector:()=>null},storedTeamIdeas:()=>{touched=true;return []}};
  vm.createContext(ctx);vm.runInContext(code,ctx);
  await ctx.submitAdminIdeaEdit({preventDefault(){}});
  assert.match(status,/Upload eerst een foto/);assert.equal(touched,false);
 });
}
