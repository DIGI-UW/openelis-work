const u=(t,n,c="character",r="characters")=>{if(typeof n>"u")return null;const e=n-t;return e<=10&&e>0?`${e} ${e===1?c:r} left.`:e<=0?`Maximum ${r} reached.`:null};export{u as g};
