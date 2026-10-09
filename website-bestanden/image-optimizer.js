(function(){
  const originalData = file => new Promise((resolve,reject)=>{
    const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(reader.error);reader.readAsDataURL(file);
  });
  async function readFile(file){
    if(!file || file.size>3500000 || !/^image\/(jpeg|png|webp)$/.test(file.type) || !/^https?:$/.test(location.protocol)) return originalData(file);
    const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),8000);
    try {
      const response=await fetch('/api/optimize-image',{method:'POST',headers:{'Content-Type':'application/octet-stream'},body:file,signal:controller.signal});
      if(!response.ok) return originalData(file);
      const blob=await response.blob();
      if(!blob.size || blob.size>=file.size || !/^image\/(jpeg|png|webp)$/.test(blob.type)) return originalData(file);
      return originalData(blob);
    } catch(_) {return originalData(file);} finally {clearTimeout(timer);}
  }
  window.ImageOptimizer=Object.freeze({readFile});
})();
