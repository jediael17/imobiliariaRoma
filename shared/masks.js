/* Máscaras reutilizadas nos formulários do site e do painel. */
const parseBRLInput=value=>{
 const s=String(value||'').trim().replace(/[^\d,.-]/g,'');if(!s)return 0;
 const comma=s.lastIndexOf(',');
 if(comma>=0){const whole=s.slice(0,comma).replace(/\D/g,'')||'0',fraction=s.slice(comma+1).replace(/\D/g,'').slice(0,2);return Number(whole+'.'+fraction.padEnd(2,'0'))||0}
 return Number(s.replace(/\D/g,''))||0
};
const formatBRLValue=value=>(+value||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
const formatBRLTyping=value=>String(value||'').trim()?formatBRLValue(parseBRLInput(value)):'';
const maskPhone=value=>{
 let d=String(value||'').replace(/\D/g,'');
 if(d.length>11&&d.startsWith('55'))d=d.slice(2);
 d=d.slice(0,11);
 if(d.length<=2)return d?'('+d+(d.length===2?')':''):'';
 const area='('+d.slice(0,2)+') ',subscriber=d.slice(2);
 if(d.length===10)return area+subscriber.slice(0,4)+'-'+subscriber.slice(4);
 return area+subscriber.slice(0,1)+(subscriber.length>1?' '+subscriber.slice(1,5):'')+(subscriber.length>5?'-'+subscriber.slice(5):'')
};
const maskCEP=value=>{
 const digits=String(value||'').replace(/\D/g,'').slice(0,8);
 return digits.length>5?digits.slice(0,5)+'-'+digits.slice(5):digits
};
const maskCPF=value=>{
 const digits=String(value||'').replace(/\D/g,'').slice(0,11);
 return digits.length>9?digits.slice(0,3)+'.'+digits.slice(3,6)+'.'+digits.slice(6,9)+'-'+digits.slice(9):digits.length>6?digits.slice(0,3)+'.'+digits.slice(3,6)+'.'+digits.slice(6):digits.length>3?digits.slice(0,3)+'.'+digits.slice(3):digits
};
const validCPF=value=>{
 const digits=String(value||'').replace(/\D/g,'');
 if(digits.length!==11||/^(\d)\1{10}$/.test(digits))return false;
 const digitAt=length=>{let sum=0;for(let i=0;i<length;i++)sum+=Number(digits[i])*(length+1-i);const remainder=(sum*10)%11;return remainder===10?0:remainder};
 return digitAt(9)===Number(digits[9])&&digitAt(10)===Number(digits[10])
};
const applyInputMasks=root=>{
 root.querySelectorAll('[data-mask="brl"]').forEach(input=>{input.value=formatBRLTyping(input.value)});
 root.querySelectorAll('[data-mask="phone"]').forEach(input=>{input.value=maskPhone(input.value)});
 root.querySelectorAll('[data-mask="cep"]').forEach(input=>{input.value=maskCEP(input.value)});
 root.querySelectorAll('[data-mask="cpf"]').forEach(input=>{input.value=maskCPF(input.value)});
};
document.addEventListener('input',e=>{
 const input=e.target,mask=input.dataset&&input.dataset.mask;
 if(mask!=='brl'&&mask!=='phone'&&mask!=='cep'&&mask!=='cpf')return;
 const start=input.selectionStart,raw=input.value,before=raw.slice(0,start),digitsBefore=before.replace(/\D/g,'').length,wasAtEnd=start===raw.length,comma=raw.indexOf(','),editingFraction=mask==='brl'&&comma>=0&&start>comma,fractionDigitsBefore=editingFraction?raw.slice(comma+1,start).replace(/\D/g,'').length:0,typedDecimal=mask==='brl'&&(e.data===','||e.data==='.');
 input.value=mask==='brl'?formatBRLTyping(raw):mask==='phone'?maskPhone(raw):mask==='cep'?maskCEP(raw):maskCPF(raw);
 if(start===null)return;
 let position=0;
 if(mask==='brl'&&input.value){
  const decimal=input.value.indexOf(',');
  if(typedDecimal)position=decimal+1;
  else if(editingFraction)position=decimal+1+fractionDigitsBefore;
  else position=decimal
 }else if(wasAtEnd)position=input.value.length;
 else if(digitsBefore){let count=0;for(;position<input.value.length;position++){if(/\d/.test(input.value[position])&&++count>=digitsBefore){position++;break}}}
 input.setSelectionRange(position,position)
});
applyInputMasks(document);
