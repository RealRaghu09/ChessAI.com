import { useEffect, useState } from "react";   
const WEB_SOCKET_URL= "ws://localhost:8765"
export const useSocket = ()=>{
    const [socket , setSocket] = useState(null)
    useEffect(()=>{
        const ws = new WebSocket(WEB_SOCKET_URL)
        ws.onopen = ()=>{
            console.log("connected")
            setSocket(ws);
        }
        ws.onclose = () =>{
            console.log("Closed Connection")
            setSocket(null)
        }
        return ()=>{
            ws.close()
        }
    },[])
    return socket
}