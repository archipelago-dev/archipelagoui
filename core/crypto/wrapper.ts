
let initfalcon:any;
let mlkem:any;
let falcon:any;
export default (async () => {

    falcon = await import('superfalcon');
    initfalcon = falcon.superFalcon;
    mlkem = await import('mlkem');
    return { falcon, initfalcon, mlkem };
})();

export { initfalcon, mlkem, falcon };