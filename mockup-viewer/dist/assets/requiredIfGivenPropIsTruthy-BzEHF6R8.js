const f=(t,i)=>(r,u,e,...n)=>r[t]===!0&&r[u]===null?new Error(`You must provide a value for \`${u}\` in \`${e}\` if \`${t}\` exists.`):i(r,u,e,...n);export{f as r};
