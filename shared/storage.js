/* Acesso ao armazenamento do navegador (localStorage) usado pelo site e pelo painel. */
const DB={get(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}}};
const DEMO_PROPERTY_SIGNATURES={'RM-001':'Residencial Aurora','RM-002':'Cobertura Skyline','RM-003':'Casa Jardim Europa','RM-004':'Casa Térrea Vila Nova','RM-005':'Sala Corporativa Centro','RM-006':'Studio Boulevard','RM-007':'Apartamento Vista Verde','RM-008':'Casa Jardim Primavera'};
const removeDemoProperties=properties=>Array.isArray(properties)?properties.filter(property=>!property||DEMO_PROPERTY_SIGNATURES[property.cod]!==property.titulo):[];
