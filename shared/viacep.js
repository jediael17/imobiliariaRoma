/* Consulta CEP e preenche os campos de endereço nos formulários. */
const lookupCEP=async cep=>{
 const digits=String(cep||'').replace(/\D/g,'');
 if(digits.length!==8)throw new Error('Informe um CEP com 8 dígitos.');
 let response;
 try{response=await fetch('https://viacep.com.br/ws/'+digits+'/json/')}catch(error){throw new Error('Não foi possível consultar o CEP. Verifique sua conexão e tente novamente.')}
 if(!response.ok)throw new Error('Não foi possível consultar o CEP. Tente novamente.');
 let address;
 try{address=await response.json()}catch(error){throw new Error('O ViaCEP retornou uma resposta inválida. Tente novamente.')}
 if(address.erro)throw new Error('CEP não encontrado.');
 return address
};
const fillAddressFromCEP=async input=>{
 const form=input.closest('form')||input.closest('.card'),status=form.querySelector('[data-cep-status]'),digits=input.value.replace(/\D/g,'');
 input.dataset.cepLast=digits;
 status.textContent='Consultando CEP…';
 try{
  const address=await lookupCEP(digits);
  if(input.value.replace(/\D/g,'')!==digits)return;
  const fields={logradouro:address.logradouro,bairro:address.bairro,cidade:address.localidade,uf:address.uf,complemento:address.complemento};
  Object.entries(fields).forEach(([name,value])=>{const field=form.querySelector('[data-cep-field="'+name+'"]');if(field&&value)field.value=value});
  status.textContent='Endereço preenchido pelo ViaCEP.'
 }catch(error){
  if(input.value.replace(/\D/g,'')!==digits)return;
  status.textContent=error.message||'Não foi possível consultar o CEP. Tente novamente.'
 }
};
document.addEventListener('input',event=>{
 const input=event.target;
 if(!input.matches('[data-cep-lookup]'))return;
 const digits=input.value.replace(/\D/g,'');
 if(digits.length===8&&input.dataset.cepLast!==digits)fillAddressFromCEP(input);
 else if(digits.length<8){delete input.dataset.cepLast;(input.closest('form')||input.closest('.card')).querySelector('[data-cep-status]').textContent=''}
});
