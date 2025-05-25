const backend = "http://localhost:5000/";
const python = "http://127.0.0.1:5001/";

const checkToken=()=>{
     if(!localStorage.getItem("token")){
          return false;
     }
     return true
}
export {backend,python,checkToken};