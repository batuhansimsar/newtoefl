"use client";
import { useEffect, useRef } from "react";
export default function Home() {
 const sent = useRef(false);
 useEffect(() => {
  if(sent.current) return; sent.current=true;
  const params = new URLSearchParams(location.search);
  const payload = {id:crypto.randomUUID(), referrer:document.referrer, source:params.get("utm_source"), medium:params.get("utm_medium"), campaign:params.get("utm_campaign"), language:navigator.language};
  fetch("/api/visit",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload),keepalive:true}).catch(()=>{});
 },[]);
 return <main><div className="message"><h1>Coming soon.</h1><p>Our website is currently closed.<br/>We’ll be opening soon.</p></div></main>;
}
