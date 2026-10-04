/* Extracts a YouTube video ID from supported public URL formats. */
function youtubeVideoId(value){
 try{
  const url=new URL(String(value||'').trim());
  const host=url.hostname.toLowerCase().replace(/^www\./,'');
  if(host==='youtu.be'){const id=url.pathname.split('/').filter(Boolean)[0]||'';return /^[\w-]{11}$/.test(id)?id:''}
  if(host!=='youtube.com'&&host!=='m.youtube.com'&&host!=='youtube-nocookie.com')return'';
  const parts=url.pathname.split('/').filter(Boolean);
  const id=parts[0]==='watch'?url.searchParams.get('v'):['embed','shorts','live'].includes(parts[0])?parts[1]:'';
  return /^[\w-]{11}$/.test(id||'')?id:''
 }catch(error){return''}
}
