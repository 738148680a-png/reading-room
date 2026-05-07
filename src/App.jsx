import { useState, useEffect, useRef, useCallback } from "react";
import { themes, bubblePresets, highlightColors, defaultSettings } from "./theme";
import {
  getAllBooks, addBook, updateBook, deleteBook,
  getChaptersByBook, addChapter, updateChapter,
  getSetting, setSetting,
  parseTxt, parseHtml, mergeShortParagraphs, exportData, importData,
  callAI, getAiCache, setAiCache,
  getHighlights, addHighlight, deleteHighlight,
  getUserNotes, addUserNote, updateUserNote, deleteUserNote,
  getDiscussions, addDiscussion,
} from "./db";

/* ===== Glass Card ===== */
function G(p) {
  return (<div onClick={p.onClick} style={Object.assign({ background:"rgba(255,255,255,0.70)", backdropFilter:"blur(24px)", WebkitBackdropFilter:"blur(24px)", borderRadius:18, border:"1px solid rgba(255,255,255,0.8)", boxShadow:"0 2px 16px rgba(0,0,0,0.04), inset 0 0.5px 0 rgba(255,255,255,0.9)" }, p.s||{})}>{p.children}</div>);
}

/* ===== Render text with highlights ===== */
function renderHL(text, hls, paraIdx) {
  var mine = (hls||[]).filter(function(h){return h.paraIndex===paraIdx;}).sort(function(a,b){return a.startOffset-b.startOffset;});
  if (mine.length===0) return [{ text:text, color:null }];
  var parts=[]; var last=0;
  for (var i=0;i<mine.length;i++) {
    var h=mine[i];
    if (h.startOffset>last) parts.push({text:text.slice(last,h.startOffset),color:null});
    parts.push({text:text.slice(h.startOffset,h.endOffset),color:h.color,id:h.id});
    last=h.endOffset;
  }
  if (last<text.length) parts.push({text:text.slice(last),color:null});
  return parts;
}

/* ================================================================
   SHELF PAGE
   ================================================================ */
function ShelfPage(p) {
  var t=p.t;
  var _e=useState(false); var exp=_e[0]; var setExp=_e[1];
  var _m=useState(false); var mgr=_m[0]; var setMgr=_m[1];
  var _d=useState(null); var cfm=_d[0]; var setCfm=_d[1];
  var _up=useState(false); var uploading=_up[0]; var setUploading=_up[1];
  var fileRef=useRef(null);
  var sorted=p.books.slice().sort(function(a,b){return(b.lastReadAt||0)-(a.lastReadAt||0);});
  var shown=exp?sorted:sorted.slice(0,4);

  function handleFile(e) {
    var file=e.target.files[0]; if(!file) return;
    setUploading(true);
    var reader=new FileReader();
    reader.onload=function(ev) {
      try {
        var text=ev.target.result; var parsed;
        if(file.name.match(/\.html?$/i)) parsed=parseHtml(text,file.name);
        else parsed=parseTxt(text,file.name);
        p.onUpload(parsed);
      } catch(err) { alert("\u89E3\u6790\u5931\u8D25\uFF1A"+err.message); }
      setUploading(false); if(fileRef.current) fileRef.current.value="";
    };
    reader.readAsText(file);
  }

  return (
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 0 8px"}}>
        <div style={{visibility:"hidden",width:34}}/>
        <div style={{fontSize:17,fontWeight:700,color:t.text}}>{"\uD83D\uDCDA \u5171\u8BFB\u4E66\u623F"}</div>
        <div onClick={p.onSettings} style={{width:34,height:34,borderRadius:11,background:t.solid,border:"1px solid "+t.borderSub,boxShadow:"0 1px 4px rgba(0,0,0,0.04)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,cursor:"pointer",color:t.sub}}>{"\u2699\uFE0F"}</div>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:14}}>
        <div onClick={function(){setMgr(!mgr);setCfm(null);}} style={{flex:1,textAlign:"center",padding:"9px 0",borderRadius:12,cursor:"pointer",fontSize:13,fontWeight:500,background:mgr?t.accent+"18":"transparent",color:mgr?t.accent:t.sub,border:mgr?"1px solid "+t.accent+"44":"1px solid rgba(0,0,0,0.06)"}}>{mgr?"\u2714 \u5B8C\u6210":"\uD83D\uDCCB \u7BA1\u7406\u4E66\u67B6"}</div>
        <label style={{flex:1,textAlign:"center",padding:"9px 0",borderRadius:12,cursor:"pointer",fontSize:13,fontWeight:500,background:t.fresh,color:"#fff",boxShadow:"0 2px 8px "+t.fresh+"44",opacity:uploading?0.6:1}}>
          {uploading?"\u89E3\u6790\u4E2D...":"\u2795 \u4E0A\u4F20\u65B0\u4E66"}
          <input ref={fileRef} type="file" accept=".txt,.html,.htm" onChange={handleFile} style={{display:"none"}}/>
        </label>
      </div>
      {sorted.length===0 && (<G s={{padding:40,textAlign:"center"}}><div style={{fontSize:40,marginBottom:12}}>{"\uD83D\uDCDA"}</div><div style={{fontSize:14,color:t.sub}}>{"\u4E66\u67B6\u8FD8\u662F\u7A7A\u7684\uFF0C\u4E0A\u4F20\u4E00\u672C\u4E66\u5F00\u59CB\u8BFB\u5427\uFF5E"}</div><div style={{fontSize:12,color:"#ccc",marginTop:4}}>{"\u652F\u6301 txt\u3001html"}</div></G>)}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        {shown.map(function(bk){
          var ci=(bk.colorIndex||0)%3; var rc=bk.readCount||0; var tot=bk.totalChapters||1;
          var pct=Math.round((rc/tot)*100); var done=pct===100; var isCfm=cfm===bk.id;
          return (
            <G key={bk.id} s={{padding:14,display:"flex",flexDirection:"column",alignItems:"center",position:"relative",overflow:"hidden",cursor:"pointer"}} onClick={function(){if(!mgr&&!isCfm) p.onOpen(bk.id);}}>
              {isCfm&&(<div style={{position:"absolute",inset:0,zIndex:3,background:"rgba(224,144,144,0.15)",backdropFilter:"blur(4px)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",borderRadius:18,gap:8}}><div style={{fontSize:12,color:t.text,fontWeight:500,marginBottom:4}}>{"\u786E\u5B9A\u5220\u9664\uFF1F"}</div><div onClick={function(e){e.stopPropagation();p.onDelete(bk.id);setCfm(null);}} style={{padding:"7px 22px",borderRadius:12,background:"#E09090",color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer"}}>{"\u5220\u9664"}</div><div onClick={function(e){e.stopPropagation();setCfm(null);}} style={{fontSize:12,color:"#999",cursor:"pointer"}}>{"\u53D6\u6D88"}</div></div>)}
              {mgr&&!isCfm&&(<div onClick={function(e){e.stopPropagation();setCfm(bk.id);}} style={{position:"absolute",top:8,right:8,zIndex:2,width:22,height:22,borderRadius:11,background:"#E09090",color:"#fff",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>{"x"}</div>)}
              <div style={{width:56,height:72,borderRadius:12,marginBottom:10,background:"linear-gradient(135deg,"+t.cards[ci][0]+" 0%,"+t.cards[ci][1]+" 100%)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:700,color:"rgba(255,255,255,0.92)"}}>{bk.title?bk.title.charAt(0):"?"}</div>
              <div style={{fontSize:13,fontWeight:600,color:t.text,textAlign:"center",marginBottom:4,width:"100%",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{bk.title}</div>
              <div style={{fontSize:11,marginBottom:6,color:done?t.fresh:t.sub,fontWeight:done?600:400}}>{done?"\u2713 \u8BFB\u5B8C\u5566":rc+"/"+tot+" \u7AE0"}</div>
              <div style={{width:"100%",height:3,borderRadius:2,background:"rgba(0,0,0,0.05)",overflow:"hidden"}}><div style={{height:"100%",width:pct+"%",borderRadius:2,background:done?t.fresh:t.accent}}/></div>
            </G>
          );
        })}
      </div>
      {sorted.length>4&&(<div onClick={function(){setExp(!exp);}} style={{textAlign:"center",padding:"14px 0",marginTop:8,fontSize:13,color:t.accent,fontWeight:500,cursor:"pointer"}}>{exp?"\u6536\u8D77 \u25B2":"\u67E5\u770B\u5168\u90E8 "+sorted.length+" \u672C \u25BC"}</div>)}
    </div>
  );
}

/* ================================================================
   CHAPTERS PAGE
   ================================================================ */
function ChaptersPage(p) {
  var t=p.t; var bk=p.book; var chs=p.chapters; var ci=(bk.colorIndex||0)%3;
  var rc=chs.filter(function(c){return c.isRead;}).length;
  return (
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 0 8px"}}>
        <div onClick={p.onBack} style={{width:34,height:34,borderRadius:11,background:t.solid,border:"1px solid "+t.borderSub,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,cursor:"pointer",color:t.sub}}>{"\u2190"}</div>
        <div style={{fontSize:16,fontWeight:700,color:t.text}}>{bk.title}</div>
        <div style={{width:34,visibility:"hidden"}}/>
      </div>
      <G s={{padding:20,marginBottom:16,display:"flex",gap:16,alignItems:"center"}}>
        <div style={{width:60,height:80,borderRadius:14,flexShrink:0,background:"linear-gradient(135deg,"+t.cards[ci][0]+" 0%,"+t.cards[ci][1]+" 100%)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,fontWeight:700,color:"rgba(255,255,255,0.92)"}}>{bk.title?bk.title.charAt(0):"?"}</div>
        <div>
          <div style={{fontSize:17,fontWeight:700,color:t.text,marginBottom:4}}>{bk.title}</div>
          <div style={{fontSize:13,color:t.sub}}>{"\u5DF2\u8BFB "+rc+" / "+chs.length+" \u7AE0"}</div>
          <div style={{width:120,height:4,borderRadius:2,marginTop:8,background:"rgba(0,0,0,0.05)",overflow:"hidden"}}><div style={{height:"100%",borderRadius:2,width:Math.round((rc/chs.length)*100)+"%",background:t.accent}}/></div>
        </div>
      </G>
      <G s={{padding:4}}>
        {chs.map(function(c,i){
          return (<div key={c.id} onClick={function(){p.onOpenChapter(c.id);}} style={{display:"flex",alignItems:"center",gap:12,padding:"14px",cursor:"pointer",borderBottom:i<chs.length-1?"1px solid rgba(0,0,0,0.04)":"none"}}>
            <div style={{width:8,height:8,borderRadius:4,flexShrink:0,background:c.isRead?t.fresh:"rgba(0,0,0,0.08)"}}/>
            <div style={{flex:1,fontSize:14,fontWeight:500,color:c.isRead?t.sub:t.text}}>{"\u7B2C"+c.number+"\u7AE0\u3000"+c.title}</div>
            {c.isRead?<span style={{fontSize:11,color:t.fresh,fontWeight:600}}>{"\u2713"}</span>:<span style={{fontSize:14,color:"#ddd"}}>{"\u203A"}</span>}
          </div>);
        })}
      </G>
    </div>
  );
}

/* ================================================================
   READER PAGE — 核心：AI实装 + 划线 + 笔记
   ================================================================ */
function ReaderPage(p) {
  var t=p.t; var bk=p.book; var ch=p.chapter; var allChs=p.allChapters; var settings=p.settings;
  // Chat state
  var _msgs=useState([]); var msgs=_msgs[0]; var setMsgs=_msgs[1];
  var _inp=useState(""); var inp=_inp[0]; var setInp=_inp[1];
  var _co=useState(false); var chatOn=_co[0]; var setChatOn=_co[1];
  var _cp=useState(null); var chatP=_cp[0]; var setChatP=_cp[1];
  var _sending=useState(false); var sending=_sending[0]; var setSending=_sending[1];
  // TOC
  var _toc=useState(false); var tocOn=_toc[0]; var setTocOn=_toc[1];
  // AI story
  var _ao=useState({}); var aiOpen=_ao[0]; var setAO=_ao[1];
  var _allAi=useState(false); var allAiOn=_allAi[0]; var setAllAiOn=_allAi[1];
  var _aiStory=useState(null); var aiStory=_aiStory[0]; var setAiStory=_aiStory[1];
  var _aiStoryLoading=useState(false); var aiStoryLoading=_aiStoryLoading[0]; var setAiStoryLoading=_aiStoryLoading[1];
  // AI annotation
  var _annOpen=useState(false); var annOpen=_annOpen[0]; var setAnnOpen=_annOpen[1];
  var _aiAnn=useState(null); var aiAnn=_aiAnn[0]; var setAiAnn=_aiAnn[1];
  var _aiAnnLoading=useState(false); var aiAnnLoading=_aiAnnLoading[0]; var setAiAnnLoading=_aiAnnLoading[1];
  // User highlights
  var _hls=useState([]); var hls=_hls[0]; var setHls=_hls[1];
  var _hlMenu=useState(null); var hlMenu=_hlMenu[0]; var setHlMenu=_hlMenu[1];
  // User notes
  var _notes=useState([]); var notes=_notes[0]; var setNotes=_notes[1];
  var _noteOpen=useState({}); var noteOpen=_noteOpen[0]; var setNoteOpen=_noteOpen[1];
  var _noteEdit=useState({}); var noteEdit=_noteEdit[0]; var setNoteEdit=_noteEdit[1];
  // Feelings
  var _feel=useState(""); var feel=_feel[0]; var setFeel=_feel[1];
  // Error
  var _err=useState(""); var err=_err[0]; var setErr=_err[1];
  // Pagination
  var _pg=useState(0); var curPage=_pg[0]; var setCurPage=_pg[1];

  var bp=bubblePresets[settings.bubbleIndex||1];
  var ci=allChs.findIndex(function(c){return c.id===ch.id;});
  var hasPrev=ci>0; var hasNext=ci<allChs.length-1;
  var allParagraphs=ch.content?mergeShortParagraphs(ch.content.split(/\n\s*\n/).filter(function(s){return s.trim();})):[];
  var ppp=settings.parasPerPage||8;
  var totalPages=Math.max(1,Math.ceil(allParagraphs.length/ppp));
  var paragraphs=allParagraphs.slice(curPage*ppp,(curPage+1)*ppp);
  var paraOffset=curPage*ppp; // offset for highlight/note indices

  /* Load chapter data */
  useEffect(function(){
    setAO({}); setAllAiOn(false); setAiStory(null); setAiAnn(null); setAnnOpen(false);
    setChatOn(false); setMsgs([]); setNoteOpen({}); setNoteEdit({}); setHlMenu(null); setErr(""); setCurPage(0);
    (async function(){
      var hl=await getHighlights(ch.id); setHls(hl);
      var un=await getUserNotes(ch.id); setNotes(un);
      var cached=await getAiCache("story-"+ch.id); if(cached) setAiStory(cached.data);
      var cachedAnn=await getAiCache("ann-"+ch.id); if(cachedAnn) setAiAnn(cachedAnn.data);
      var disc=await getDiscussions(ch.id);
      if(disc.length>0) setMsgs(disc.map(function(d){return{role:d.author,text:d.content};}));
    })();
  },[ch.id]);

  /* ---- AI讲故事 (real API) ---- */
  var persona=settings.aiPersona?settings.aiPersona+"\n\n":"";
  async function loadAiStory(force) {
    if(aiStory&&!force) { toggleAllAi(); return; }
    setAiStoryLoading(true); setErr("");
    try {
      var prompt=settings.promptTemplates[settings.activePromptIndex||0].prompt;
      var numbered=allParagraphs.map(function(p,i){return "\u3010\u7B2C"+(i+1)+"\u6BB5\u3011\n"+p;}).join("\n\n");
      var sysMsg={role:"system",content:persona+prompt+"\n\n\u7528\u6237\u5C06\u7ED9\u4F60\u4E00\u7AE0\u5185\u5BB9\uFF08\u5206\u6BB5\u6807\u6CE8\uFF09\uFF0C\u8BF7\u9010\u6BB5\u7528\u5927\u767D\u8BDD\u8BB2\u89E3\u3002\u56DE\u590D\u683C\u5F0F\uFF1A\u6BCF\u6BB5\u8BB2\u89E3\u7528\u3010\u7B2CX\u6BB5\u3011\u5F00\u5934\uFF0C\u8BB2\u89E3\u5185\u5BB9\u7D27\u8DDF\u5176\u540E\u3002\u4E0D\u8981\u9057\u6F0F\u4EFB\u4F55\u6BB5\u843D\u3002"};
      var userMsg={role:"user",content:"\u4E66\u540D\uFF1A"+bk.title+"\n\u7AE0\u8282\uFF1A\u7B2C"+ch.number+"\u7AE0 "+ch.title+"\n\n"+numbered};
      var result=await callAI(settings,[sysMsg,userMsg],"storyModelName");
      var data={}; var parts=result.split(/\u3010\u7B2C(\d+)\u6BB5\u3011/);
      for(var i=1;i<parts.length;i+=2) { var idx=parseInt(parts[i])-1; if(parts[i+1]) data[idx]=parts[i+1].trim(); }
      if(Object.keys(data).length===0) data[0]=result;
      setAiStory(data);
      await setAiCache({id:"story-"+ch.id, chapterId:ch.id, type:"story", data:data});
      var n={}; allParagraphs.forEach(function(_,i){if(data[i]) n[i]=true;}); setAO(n); setAllAiOn(true);
    } catch(e) { setErr(e.message); }
    setAiStoryLoading(false);
  }

  function toggleAllAi() {
    if(allAiOn) { setAO({}); setAllAiOn(false); }
    else { var n={}; allParagraphs.forEach(function(_,i){n[i]=true;}); setAO(n); setAllAiOn(true); }
  }
  function toggleAi(i) { var n=Object.assign({},aiOpen); n[i]=!n[i]; setAO(n); }

  /* ---- AI共读批注 (real API) ---- */
  async function loadAiAnnotation(force) {
    if(aiAnn&&!force) { setAnnOpen(!annOpen); return; }
    setAiAnnLoading(true); setErr("");
    try {
      var prompt=settings.annotationPrompt||defaultSettings.annotationPrompt;
      var numbered=allParagraphs.map(function(p,i){return "\u3010\u7B2C"+(i+1)+"\u6BB5\u3011\n"+p;}).join("\n\n");
      var sysMsg={role:"system",content:persona+prompt+"\n\n\u56DE\u590D\u683C\u5F0F\uFF1A\u5BF9\u6BCF\u4E2A\u4F60\u60F3\u8BC4\u8BBA\u7684\u6BB5\u843D\uFF0C\u7528\u3010\u7B2CX\u6BB5\u3011\u6807\u6CE8\u6BB5\u843D\u5E8F\u53F7\uFF0C\u7136\u540E\u5199\u4F60\u7684\u8BC4\u8BBA\u3002"};
      var userMsg={role:"user",content:"\u4E66\u540D\uFF1A"+bk.title+"\n\u7AE0\u8282\uFF1A\u7B2C"+ch.number+"\u7AE0 "+ch.title+"\n\n"+numbered};
      var result=await callAI(settings,[sysMsg,userMsg],"annotationModelName");
      var data={}; var parts=result.split(/\u3010\u7B2C(\d+)\u6BB5\u3011/);
      for(var i=1;i<parts.length;i+=2) { var idx=parseInt(parts[i])-1; if(parts[i+1]) data[idx]=parts[i+1].trim(); }
      if(Object.keys(data).length===0) data[0]=result;
      setAiAnn(data); setAnnOpen(true);
      await setAiCache({id:"ann-"+ch.id, chapterId:ch.id, type:"annotation", data:data});
    } catch(e) { setErr(e.message); }
    setAiAnnLoading(false);
  }

  /* ---- 讨论/聊天 (real API, 带AI讲解和批注上下文) ---- */
  async function send() {
    if(!inp.trim()||sending) return;
    var userText=inp; setInp(""); setSending(true); setErr("");
    var newMsgs=msgs.concat([{role:"user",text:userText}]);
    setMsgs(newMsgs);
    await addDiscussion({chapterId:ch.id, author:"user", content:userText, createdAt:Date.now()});
    try {
      var ctx=chatP!==null?"\n\n\u5F53\u524D\u8BA8\u8BBA\u7684\u6BB5\u843D\uFF08\u7B2C"+(chatP+1)+"\u6BB5\uFF09\uFF1A\n"+allParagraphs[chatP]:"";
      /* 带入AI讲解和批注作为上下文 */
      if(chatP!==null&&aiStory&&aiStory[chatP]) ctx+="\n\nAI\u5BF9\u8FD9\u6BB5\u7684\u8BB2\u89E3\uFF1A\n"+aiStory[chatP];
      if(chatP!==null&&aiAnn&&aiAnn[chatP]) ctx+="\n\nAI\u5BF9\u8FD9\u6BB5\u7684\u6279\u6CE8\uFF1A\n"+aiAnn[chatP];
      var sysMsg={role:"system",content:persona+"\u4F60\u6B63\u5728\u548C\u7528\u6237\u8BA8\u8BBA\u300A"+bk.title+"\u300B\u7B2C"+ch.number+"\u7AE0\u300C"+ch.title+"\u300D\u7684\u5185\u5BB9\u3002"+ctx+"\n\n\u8BF7\u56F4\u7ED5\u7AE0\u8282\u5185\u5BB9\u8FDB\u884C\u6709\u89C1\u5730\u7684\u8BA8\u8BBA\u3002"};
      var apiMsgs=[sysMsg];
      // Include recent chat history (last 10 messages)
      var recent=newMsgs.slice(-10);
      for(var i=0;i<recent.length;i++) apiMsgs.push({role:recent[i].role==="user"?"user":"assistant",content:recent[i].text});
      var result=await callAI(settings,apiMsgs,"discussModelName");
      setMsgs(function(prev){return prev.concat([{role:"ai",text:result}]);});
      await addDiscussion({chapterId:ch.id, author:"ai", content:result, createdAt:Date.now()});
    } catch(e) {
      setMsgs(function(prev){return prev.concat([{role:"ai",text:"\u274C "+e.message}]);});
    }
    setSending(false);
  }

  /* ---- 划线 ---- */
  function handleTextSelect(paraIdx) {
    var sel=window.getSelection();
    if(!sel||sel.isCollapsed||!sel.toString().trim()) { setHlMenu(null); return; }
    // Find offsets relative to the paragraph text
    var range=sel.getRangeAt(0);
    var paraText=allParagraphs[paraIdx];
    var selectedText=sel.toString();
    var startOffset=paraText.indexOf(selectedText);
    if(startOffset===-1) { setHlMenu(null); return; }
    var endOffset=startOffset+selectedText.length;
    // Get position for menu
    var rect=range.getBoundingClientRect();
    setHlMenu({paraIdx:paraIdx, startOffset:startOffset, endOffset:endOffset, text:selectedText, top:rect.top+window.scrollY-50, left:rect.left});
  }

  async function saveHighlight(color) {
    if(!hlMenu) return;
    var h={chapterId:ch.id, paraIndex:hlMenu.paraIdx, startOffset:hlMenu.startOffset, endOffset:hlMenu.endOffset, text:hlMenu.text, color:color};
    var id=await addHighlight(h); h.id=id;
    setHls(hls.concat([h]));
    setHlMenu(null); window.getSelection().removeAllRanges();
  }

  async function removeHighlight(id) {
    await deleteHighlight(id);
    setHls(hls.filter(function(h){return h.id!==id;}));
  }

  /* ---- 用户笔记 ---- */
  function toggleNote(i) { var n=Object.assign({},noteOpen); n[i]=!n[i]; setNoteOpen(n); }
  function editNote(i,v) { var n=Object.assign({},noteEdit); n[i]=v; setNoteEdit(n); }

  async function saveNote(paraIdx) {
    var content=(noteEdit[paraIdx]||"").trim(); if(!content) return;
    var existing=notes.find(function(n){return n.paraIndex===paraIdx;});
    if(existing) {
      existing.content=content; await updateUserNote(existing);
      setNotes(notes.map(function(n){return n.id===existing.id?existing:n;}));
    } else {
      var n={chapterId:ch.id, paraIndex:paraIdx, content:content, createdAt:Date.now()};
      var id=await addUserNote(n); n.id=id;
      setNotes(notes.concat([n]));
    }
    var ne=Object.assign({},noteEdit); delete ne[paraIdx]; setNoteEdit(ne);
  }

  async function removeNote(paraIdx) {
    var existing=notes.find(function(n){return n.paraIndex===paraIdx;});
    if(existing) { await deleteUserNote(existing.id); setNotes(notes.filter(function(n){return n.id!==existing.id;})); }
    var ne=Object.assign({},noteEdit); delete ne[paraIdx]; setNoteEdit(ne);
    var no=Object.assign({},noteOpen); no[paraIdx]=false; setNoteOpen(no);
  }

  function startChat(idx) { setChatP(idx); setChatOn(true); }

  return (
    <div>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 0 4px"}}>
        <div onClick={p.onBack} style={{width:34,height:34,borderRadius:11,background:t.solid,border:"1px solid "+t.borderSub,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,cursor:"pointer",color:t.sub}}>{"\u2190"}</div>
        <div style={{flex:1,textAlign:"center"}}><div style={{fontSize:11,color:t.sub}}>{bk.title}</div><div style={{fontSize:14,fontWeight:600,color:t.text}}>{"\u7B2C"+ch.number+"\u7AE0"}</div></div>
        <div onClick={function(){setTocOn(!tocOn);}} style={{width:34,height:34,borderRadius:11,background:t.solid,border:"1px solid "+t.borderSub,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,cursor:"pointer",color:t.sub}}>{"\u2630"}</div>
      </div>

      {/* TOC */}
      {tocOn&&(<G s={{padding:12,marginBottom:12}}>
        {allChs.map(function(c,i){var cur=c.id===ch.id;return(
          <div key={c.id} onClick={function(){p.onNav(c.id);setTocOn(false);}} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 4px",cursor:"pointer",borderBottom:i<allChs.length-1?"1px solid rgba(0,0,0,0.04)":"none"}}>
            <div style={{width:6,height:6,borderRadius:3,background:c.isRead?t.fresh:cur?t.accent:"rgba(0,0,0,0.08)"}}/>
            <div style={{fontSize:13,flex:1,color:cur?t.accent:c.isRead?t.sub:t.text,fontWeight:cur?600:400}}>{"\u7B2C"+c.number+"\u7AE0 "+c.title}</div>
            {c.isRead&&<span style={{fontSize:10,color:t.fresh}}>{"\u2713"}</span>}
          </div>);
        })}
      </G>)}

      <div style={{fontSize:18,fontWeight:700,color:t.accent,marginBottom:12,lineHeight:1.4}}>{ch.title}</div>

      {/* Error display */}
      {err&&(<div style={{padding:"10px 14px",borderRadius:12,background:"#FEE",color:"#C33",fontSize:12,marginBottom:12,lineHeight:1.5}}>{"\u274C "+err}<div onClick={function(){setErr("");}} style={{fontSize:11,color:"#999",cursor:"pointer",marginTop:4}}>{"\u5173\u95ED"}</div></div>)}

      {/* AI top buttons */}
      {allParagraphs.length>0&&(<div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
        {settings.aiStoryEnabled&&(
          <div onClick={aiStoryLoading?null:loadAiStory} style={{padding:"7px 14px",borderRadius:10,cursor:"pointer",background:aiStoryLoading?"#ccc":allAiOn?t.accent+"22":t.accent,color:allAiOn?t.accent:"#fff",fontSize:12,fontWeight:600,border:allAiOn?"1px solid "+t.accent:"none",opacity:aiStoryLoading?0.7:1}}>{aiStoryLoading?"\u2B50 \u52A0\u8F7D\u4E2D...":(allAiOn&&aiStory)?"\uD83C\uDFA4 \u6536\u8D77\u8BB2\u89E3":"\uD83C\uDFA4 AI\u8BB2\u6545\u4E8B"}</div>
        )}
        {settings.aiStoryEnabled&&aiStory&&(
          <div onClick={function(){loadAiStory(true);}} style={{padding:"7px 10px",borderRadius:10,cursor:"pointer",background:"transparent",color:t.accent,fontSize:11,border:"1px solid "+t.accent+"44"}}>{"\uD83D\uDD04 \u91CD\u65B0\u751F\u6210"}</div>
        )}
        {settings.aiAnnotationEnabled&&(
          <div onClick={aiAnnLoading?null:loadAiAnnotation} style={{padding:"7px 14px",borderRadius:10,cursor:"pointer",background:aiAnnLoading?"#ccc":annOpen?t.accent2+"22":t.accent2,color:annOpen?t.accent2:"#fff",fontSize:12,fontWeight:600,border:annOpen?"1px solid "+t.accent2:"none",opacity:aiAnnLoading?0.7:1}}>{aiAnnLoading?"\u270D\uFE0F \u52A0\u8F7D\u4E2D...":(annOpen&&aiAnn)?"\uD83D\uDCDD \u6536\u8D77\u6279\u6CE8":"\uD83D\uDCDD AI\u5171\u8BFB\u6279\u6CE8"}</div>
        )}
        {settings.aiAnnotationEnabled&&aiAnn&&(
          <div onClick={function(){loadAiAnnotation(true);}} style={{padding:"7px 10px",borderRadius:10,cursor:"pointer",background:"transparent",color:t.accent2,fontSize:11,border:"1px solid "+t.accent2+"44"}}>{"\uD83D\uDD04 \u91CD\u65B0\u6279\u6CE8"}</div>
        )}
        {settings.aiDiscussEnabled&&(
          <div onClick={function(){setChatP(null);setChatOn(!chatOn);}} style={{padding:"7px 14px",borderRadius:10,cursor:"pointer",background:chatOn?t.freshLight:t.fresh,color:chatOn?t.fresh:"#fff",fontSize:12,fontWeight:600,border:chatOn?"1px solid "+t.freshBorder:"none"}}>{chatOn?"\uD83D\uDCAC \u6536\u8D77\u8BA8\u8BBA":"\uD83D\uDCAC \u8BA8\u8BBA\u672C\u7AE0"}</div>
        )}
      </div>)}

      {/* Highlight color picker (floating) */}
      {hlMenu&&(<div style={{position:"absolute",top:hlMenu.top,left:Math.max(16,Math.min(hlMenu.left,window.innerWidth-200)),zIndex:99,background:"#fff",borderRadius:14,padding:"8px 12px",boxShadow:"0 4px 20px rgba(0,0,0,0.15)",display:"flex",gap:8,alignItems:"center"}}>
        <span style={{fontSize:11,color:"#999"}}>{"\u5212\u7EBF"}</span>
        {highlightColors.map(function(hc){return(
          <div key={hc.color} onClick={function(){saveHighlight(hc.color);}} style={{width:26,height:26,borderRadius:13,background:hc.color,cursor:"pointer",border:"2px solid rgba(0,0,0,0.1)"}}/>
        );})}
        <div onClick={function(){setHlMenu(null);window.getSelection().removeAllRanges();}} style={{fontSize:11,color:"#999",cursor:"pointer",marginLeft:4}}>{"\u2715"}</div>
      </div>)}

      {/* Pagination top */}
      {totalPages>1&&(<div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:12,marginBottom:12}}>
        <div onClick={function(){if(curPage>0){setCurPage(curPage-1);window.scrollTo(0,0);}}} style={{padding:"6px 14px",borderRadius:10,cursor:curPage>0?"pointer":"default",background:curPage>0?t.solid:"transparent",color:curPage>0?t.text:"#ccc",fontSize:12,border:"1px solid "+(curPage>0?t.borderSub:"rgba(0,0,0,0.04)")}}>{"\u2190 \u4E0A\u4E00\u9875"}</div>
        <span style={{fontSize:12,color:t.sub}}>{(curPage+1)+" / "+totalPages+" \u9875"}</span>
        <div onClick={function(){if(curPage<totalPages-1){setCurPage(curPage+1);window.scrollTo(0,0);}}} style={{padding:"6px 14px",borderRadius:10,cursor:curPage<totalPages-1?"pointer":"default",background:curPage<totalPages-1?t.solid:"transparent",color:curPage<totalPages-1?t.text:"#ccc",fontSize:12,border:"1px solid "+(curPage<totalPages-1?t.borderSub:"rgba(0,0,0,0.04)")}}>{"\u4E0B\u4E00\u9875 \u2192"}</div>
      </div>)}

      {/* Content */}
      <G s={{padding:20,marginBottom:12}}>
        {paragraphs.map(function(para,i){
          var gi=i+paraOffset; // global index
          var isAiOpen=aiOpen[gi];
          var hasAiStory=aiStory&&aiStory[gi];
          var hasAiAnn=aiAnn&&aiAnn[gi];
          var myNote=notes.find(function(n){return n.paraIndex===gi;});
          var isNoteOpen=noteOpen[gi];
          var hlParts=renderHL(para,hls,gi);

          return (
            <div key={gi} style={{marginBottom:i<paragraphs.length-1?20:0}}>
              <p onMouseUp={function(){handleTextSelect(gi);}} onTouchEnd={function(){setTimeout(function(){handleTextSelect(gi);},300);}} style={{fontSize:15,lineHeight:2,color:t.text,margin:0,textAlign:"justify",cursor:"text",whiteSpace:"pre-wrap"}}>
                {hlParts.map(function(part,j){
                  if(part.color) return <span key={j} onClick={function(e){e.stopPropagation();if(confirm("\u5220\u9664\u8FD9\u6761\u5212\u7EBF\uFF1F")) removeHighlight(part.id);}} style={{borderBottom:"3px solid "+part.color,paddingBottom:1,cursor:"pointer"}}>{part.text}</span>;
                  return <span key={j}>{part.text}</span>;
                })}
              </p>
              <div style={{display:"flex",gap:6,marginTop:6,flexWrap:"wrap",alignItems:"center"}}>
                {settings.aiStoryEnabled&&hasAiStory&&(
                  <div onClick={function(){toggleAi(gi);}} style={{display:"inline-flex",alignItems:"center",gap:3,padding:"3px 9px",borderRadius:8,cursor:"pointer",background:isAiOpen?t.accent:t.accentLight,fontSize:11,color:isAiOpen?"#fff":t.accent,fontWeight:500,border:"1px solid "+t.accent+"22"}}>{isAiOpen?"\uD83D\uDCA1 \u6536\u8D77":"\uD83D\uDCA1 \u8BB2\u89E3"}</div>
                )}
                {settings.aiDiscussEnabled&&(
                  <div onClick={function(){startChat(gi);}} style={{display:"inline-flex",alignItems:"center",gap:3,padding:"3px 9px",borderRadius:8,cursor:"pointer",background:t.freshLight,fontSize:11,color:t.fresh,fontWeight:500,border:"1px solid "+t.freshBorder}}>{"\u804A\u8FD9\u6BB5"}</div>
                )}
                <div onClick={function(){toggleNote(gi); if(!noteOpen[gi]&&myNote) editNote(gi,myNote.content);}} style={{display:"inline-flex",alignItems:"center",gap:3,padding:"3px 9px",borderRadius:8,cursor:"pointer",background:myNote?"#FFF0D4":"rgba(0,0,0,0.03)",fontSize:11,color:myNote?"#B8860B":"#999",fontWeight:500,border:myNote?"1px solid #FFD70044":"1px solid rgba(0,0,0,0.06)"}}>{myNote?"\uD83D\uDCCC \u6211\u7684\u7B14\u8BB0":"\u270F\uFE0F \u8BB0\u7B14\u8BB0"}</div>
              </div>

              {/* AI Story expanded */}
              {isAiOpen&&hasAiStory&&(
                <div style={{marginTop:8,padding:"10px 14px",borderRadius:12,background:bp.ai,color:bp.aiText,fontSize:13,lineHeight:1.7,borderLeft:"3px solid "+t.accent}}>
                  {"\uD83D\uDCA1 "+aiStory[gi]}
                </div>
              )}

              {/* AI Annotation expanded */}
              {annOpen&&hasAiAnn&&(
                <div style={{marginTop:8,padding:"10px 14px",borderRadius:12,background:t.accent2+"18",color:t.text,fontSize:13,lineHeight:1.7,borderLeft:"3px solid "+t.accent2}}>
                  {"\u270D\uFE0F "+aiAnn[gi]}
                </div>
              )}

              {/* User Note expanded */}
              {isNoteOpen&&(
                <div style={{marginTop:8,padding:"10px 14px",borderRadius:12,background:"#FFFDE7",border:"1px solid #FFD70033",fontSize:13}}>
                  <textarea value={noteEdit[gi]!==undefined?noteEdit[gi]:(myNote?myNote.content:"")} onChange={function(e){editNote(gi,e.target.value);}} placeholder={"\u5199\u4E0B\u4F60\u7684\u7B14\u8BB0..."} style={{width:"100%",minHeight:60,border:"none",background:"transparent",fontSize:13,lineHeight:1.7,color:t.text,outline:"none",resize:"vertical",fontFamily:"inherit"}}/>
                  <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:6}}>
                    {myNote&&(<div onClick={function(){removeNote(gi);}} style={{fontSize:11,color:"#C33",cursor:"pointer",padding:"4px 8px"}}>{"\u5220\u9664"}</div>)}
                    <div onClick={function(){toggleNote(gi);}} style={{fontSize:11,color:"#999",cursor:"pointer",padding:"4px 8px"}}>{"\u6536\u8D77"}</div>
                    <div onClick={function(){saveNote(gi);}} style={{fontSize:11,color:t.accent,fontWeight:600,cursor:"pointer",padding:"4px 8px",background:t.accentLight,borderRadius:8}}>{"\u4FDD\u5B58"}</div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </G>

      {/* Pagination bottom */}
      {totalPages>1&&(<div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:12,flexWrap:"wrap"}}>
        <div onClick={function(){if(curPage>0){setCurPage(curPage-1);window.scrollTo(0,0);}}} style={{padding:"8px 16px",borderRadius:12,cursor:curPage>0?"pointer":"default",background:curPage>0?t.solid:"transparent",color:curPage>0?t.text:"#ccc",fontSize:13,fontWeight:500,border:"1px solid "+(curPage>0?t.borderSub:"rgba(0,0,0,0.04)")}}>{"\u2190"}</div>
        {Array.from({length:totalPages},function(_,pg){return(
          <div key={pg} onClick={function(){setCurPage(pg);window.scrollTo(0,0);}} style={{width:30,height:30,borderRadius:15,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:pg===curPage?700:400,cursor:"pointer",background:pg===curPage?t.accent:"transparent",color:pg===curPage?"#fff":t.sub}}>{pg+1}</div>
        );})}
        <div onClick={function(){if(curPage<totalPages-1){setCurPage(curPage+1);window.scrollTo(0,0);}}} style={{padding:"8px 16px",borderRadius:12,cursor:curPage<totalPages-1?"pointer":"default",background:curPage<totalPages-1?t.solid:"transparent",color:curPage<totalPages-1?t.text:"#ccc",fontSize:13,fontWeight:500,border:"1px solid "+(curPage<totalPages-1?t.borderSub:"rgba(0,0,0,0.04)")}}>{"\u2192"}</div>
      </div>)}

      {/* Feelings */}
      <G s={{padding:16,marginBottom:12}}>
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}><span style={{fontSize:14}}>{"\uD83D\uDCDD"}</span><span style={{fontSize:13,fontWeight:600,color:t.text}}>{"\u7AE0\u672B\u611F\u60F3"}</span></div>
        <div style={{display:"flex",gap:8}}>
          <input value={feel} onChange={function(e){setFeel(e.target.value);}} placeholder={"\u5199\u4E0B\u4F60\u7684\u8BFB\u540E\u611F..."} style={{flex:1,padding:"10px 14px",borderRadius:12,background:"rgba(0,0,0,0.02)",border:"1px solid rgba(0,0,0,0.06)",fontSize:13,color:t.text,outline:"none",fontFamily:"inherit"}}/>
          <div onClick={async function(){if(!feel.trim()) return; await addDiscussion({chapterId:ch.id,author:"user",content:"\u3010\u611F\u60F3\u3011"+feel,createdAt:Date.now()}); setFeel("");}} style={{padding:"10px 14px",borderRadius:12,background:t.accent,color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center"}}>{"\u4FDD\u5B58"}</div>
        </div>
      </G>

      {/* Chat panel */}
      {chatOn&&(<G s={{padding:16,marginBottom:12}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <span style={{fontSize:13,fontWeight:600,color:t.text}}>{chatP!==null?"\uD83D\uDCAC \u804A\u7B2C"+(chatP+1)+"\u6BB5":"\uD83D\uDCAC \u8BA8\u8BBA\u00B7\u7B2C"+ch.number+"\u7AE0"}</span>
          <span onClick={function(){setChatOn(false);setChatP(null);}} style={{fontSize:12,color:t.sub,cursor:"pointer"}}>{"\u6536\u8D77 \u25B2"}</span>
        </div>
        {chatP!==null&&allParagraphs[chatP]&&(<div style={{fontSize:11,color:t.sub,padding:"6px 10px",borderRadius:8,background:"rgba(0,0,0,0.02)",marginBottom:10,lineHeight:1.5}}>{"\u6B63\u5728\u8BA8\u8BBA\uFF1A"+allParagraphs[chatP].substring(0,60)+"..."}</div>)}
        {msgs.length===0&&<div style={{fontSize:12,color:"#ccc",textAlign:"center",padding:"16px 0"}}>{"\u8FD8\u6CA1\u6709\u8BA8\u8BBA\uFF0C\u8BF4\u70B9\u4EC0\u4E48\u5427\uFF5E"}</div>}
        <div style={{maxHeight:300,overflowY:"auto",marginBottom:8}}>
          {msgs.map(function(m,i){var isU=m.role==="user";return(
            <div key={i} style={{display:"flex",justifyContent:isU?"flex-end":"flex-start",marginBottom:8}}>
              <div style={{background:isU?bp.user:bp.ai,color:isU?bp.userText:bp.aiText,borderRadius:isU?"14px 14px 4px 14px":"14px 14px 14px 4px",padding:"9px 13px",maxWidth:"80%",fontSize:13,lineHeight:1.7,whiteSpace:"pre-wrap"}}>{m.text}</div>
            </div>);
          })}
          {sending&&<div style={{display:"flex",marginBottom:8}}><div style={{background:bp.ai,color:bp.aiText,borderRadius:"14px 14px 14px 4px",padding:"9px 13px",fontSize:13}}>{"..."}</div></div>}
        </div>
        <div style={{display:"flex",gap:8}}>
          <input value={inp} onChange={function(e){setInp(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter") send();}} placeholder={"\u8BF4\u70B9\u4EC0\u4E48..."} style={{flex:1,padding:"10px 14px",borderRadius:12,background:"rgba(0,0,0,0.02)",border:"1px solid rgba(0,0,0,0.06)",fontSize:13,color:t.text,outline:"none",fontFamily:"inherit"}} disabled={sending}/>
          <div onClick={send} style={{padding:"10px 14px",borderRadius:12,background:sending?"#ccc":t.accent,color:"#fff",fontSize:13,fontWeight:600,cursor:sending?"default":"pointer",display:"flex",alignItems:"center"}}>{sending?"\u2026":"\u53D1\u9001"}</div>
        </div>
      </G>)}

      {/* Navigation */}
      <div style={{display:"flex",gap:8,marginBottom:12}}>
        {hasPrev&&<div onClick={function(){p.onNav(allChs[ci-1].id);}} style={{flex:1,textAlign:"center",padding:"12px 0",borderRadius:14,background:t.solid,border:"1px solid "+t.borderSub,fontSize:13,color:t.sub,cursor:"pointer"}}>{"\u2190 \u4E0A\u4E00\u7AE0"}</div>}
        {!ch.isRead
          ?<div onClick={function(){p.onMarkRead(ch.id);}} style={{flex:1,textAlign:"center",padding:"12px 0",borderRadius:14,background:t.fresh,color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer"}}>{"\u2713 \u6807\u8BB0\u5DF2\u8BFB"}</div>
          :<div style={{flex:1,textAlign:"center",padding:"12px 0",borderRadius:14,background:t.freshLight,color:t.fresh,border:"1px solid "+t.freshBorder,fontSize:13,fontWeight:500}}>{"\u2713 \u5DF2\u8BFB"}</div>
        }
        {hasNext&&<div onClick={function(){p.onNav(allChs[ci+1].id);}} style={{flex:1,textAlign:"center",padding:"12px 0",borderRadius:14,background:t.accent,color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer"}}>{"\u4E0B\u4E00\u7AE0 \u2192"}</div>}
      </div>
    </div>
  );
}

/* ================================================================
   SETTINGS PAGE — 通用API配置
   ================================================================ */
function SettingsPage(p) {
  var t=p.t; var s=p.settings;
  function toggle(key) { var ns=Object.assign({},s); ns[key]=!ns[key]; p.onUpdate(ns); }
  function setVal(key,val) { var ns=Object.assign({},s); ns[key]=val; p.onUpdate(ns); }

  function ToggleRow(props) {
    var on=s[props.k];
    return (<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:props.last?"none":"1px solid rgba(0,0,0,0.04)"}}>
      <div><div style={{fontSize:13,color:t.text,fontWeight:500}}>{props.label}</div><div style={{fontSize:10,color:t.sub,marginTop:2}}>{props.desc}</div></div>
      <div onClick={function(){toggle(props.k);}} style={{width:44,height:26,borderRadius:13,cursor:"pointer",background:on?t.accent:"rgba(0,0,0,0.08)",transition:"background 0.2s",position:"relative"}}><div style={{width:22,height:22,borderRadius:11,background:"#fff",boxShadow:"0 1px 4px rgba(0,0,0,0.15)",position:"absolute",top:2,left:on?20:2,transition:"left 0.2s"}}/></div>
    </div>);
  }

  function InputRow(props) {
    return (<div style={{marginBottom:12}}>
      <div style={{fontSize:12,color:t.text,fontWeight:500,marginBottom:4}}>{props.label}</div>
      {props.desc&&<div style={{fontSize:10,color:t.sub,marginBottom:4}}>{props.desc}</div>}
      <input value={s[props.k]||""} onChange={function(e){setVal(props.k,e.target.value);}} placeholder={props.placeholder||""} type={props.type||"text"} style={{width:"100%",padding:"10px 14px",borderRadius:12,background:"rgba(0,0,0,0.02)",border:"1px solid rgba(0,0,0,0.06)",fontSize:13,color:t.text,outline:"none",fontFamily:"inherit"}}/>
    </div>);
  }

  return (
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 0 8px"}}>
        <div onClick={p.onBack} style={{width:34,height:34,borderRadius:11,background:t.solid,border:"1px solid "+t.borderSub,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,cursor:"pointer",color:t.sub}}>{"\u2190"}</div>
        <div style={{fontSize:16,fontWeight:700,color:t.text}}>{"\u2699\uFE0F \u8BBE\u7F6E"}</div>
        <div style={{width:34,visibility:"hidden"}}/>
      </div>

      {/* API Config */}
      <G s={{padding:16,marginBottom:12}}>
        <div style={{fontSize:13,fontWeight:600,color:t.text,marginBottom:4}}>{"\uD83D\uDD11 API \u63A5\u5165"}</div>
        <div style={{fontSize:10,color:t.sub,marginBottom:12,lineHeight:1.5}}>{"\u586B\u5199\u4F60\u7684API\u5730\u5740\u548C\u5BC6\u94A5\uFF0C\u652F\u6301OpenRouter\u3001DeepSeek\u3001OpenAI\u7B49\u517C\u5BB9\u63A5\u53E3"}</div>
        <InputRow k="apiUrl" label="API URL" placeholder="https://openrouter.ai/api/v1/chat/completions"/>
        <InputRow k="apiKey" label="API Key" placeholder="sk-..." type="password"/>
        <InputRow k="modelName" label={"\u9ED8\u8BA4\u6A21\u578B"} placeholder="\u5982 anthropic/claude-sonnet-4-20250514" desc={"\u586B\u6A21\u578B\u540D\u79F0\uFF0C\u5982OpenRouter\u7684 anthropic/claude-sonnet-4-20250514\u3001deepseek/deepseek-chat \u7B49"}/>
      </G>

      {/* AI Persona - 全局人设 */}
      <G s={{padding:16,marginBottom:12}}>
        <div style={{fontSize:13,fontWeight:600,color:t.text,marginBottom:4}}>{"\uD83C\uAD78 AI \u4EBA\u8BBE\uFF08\u5168\u5C40\uFF09"}</div>
        <div style={{fontSize:10,color:t.sub,marginBottom:8,lineHeight:1.5}}>{"\u8FD9\u6BB5\u4F1A\u52A0\u5728\u6240\u6709AI\u529F\u80FD\u7684\u63D0\u793A\u8BCD\u524D\u9762\uFF0C\u7ED9AI\u4E00\u4E2A\u7EDF\u4E00\u7684\u4EBA\u8BBE/\u6027\u683C"}</div>
        <textarea value={s.aiPersona||""} onChange={function(e){setVal("aiPersona",e.target.value);}} placeholder={"\u4F8B\u5982\uFF1A\u4F60\u662F\u4E00\u4E2A\u6E29\u67D4\u7684\u9605\u8BFB\u4F19\u4F34\uFF0C\u8BF4\u8BDD\u98CE\u683C\u8F7B\u677E\u53EF\u7231\uFF0C\u559C\u6B22\u7528emoji..."} style={{width:"100%",minHeight:80,padding:"10px 14px",borderRadius:12,background:"rgba(0,0,0,0.02)",border:"1px solid rgba(0,0,0,0.06)",fontSize:13,color:t.text,outline:"none",resize:"vertical",fontFamily:"inherit",lineHeight:1.6}}/>
      </G>

      {/* Per-feature model override */}
      <G s={{padding:16,marginBottom:12}}>
        <div style={{fontSize:13,fontWeight:600,color:t.text,marginBottom:4}}>{"\uD83C\uDFAF \u529F\u80FD\u6A21\u578B\uFF08\u53EF\u9009\uFF09"}</div>
        <div style={{fontSize:10,color:t.sub,marginBottom:12,lineHeight:1.5}}>{"\u7559\u7A7A\u5219\u7528\u4E0A\u9762\u7684\u9ED8\u8BA4\u6A21\u578B"}</div>
        <InputRow k="storyModelName" label={"\uD83C\uDFA4 AI\u8BB2\u6545\u4E8B \u6A21\u578B"} placeholder={"\u7559\u7A7A\u7528\u9ED8\u8BA4"}/>
        <InputRow k="annotationModelName" label={"\uD83D\uDCDD AI\u5171\u8BFB\u6279\u6CE8 \u6A21\u578B"} placeholder={"\u7559\u7A7A\u7528\u9ED8\u8BA4"}/>
        <InputRow k="discussModelName" label={"\uD83D\uDCAC \u8BA8\u8BBA\u5BF9\u8BDD \u6A21\u578B"} placeholder={"\u7559\u7A7A\u7528\u9ED8\u8BA4"}/>
      </G>

      {/* Reading settings */}
      <G s={{padding:16,marginBottom:12}}>
        <div style={{fontSize:13,fontWeight:600,color:t.text,marginBottom:8}}>{"\uD83D\uDCD6 \u9605\u8BFB\u8BBE\u7F6E"}</div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{fontSize:12,color:t.text}}>{"\u6BCF\u9875\u6BB5\u843D\u6570"}</div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div onClick={function(){var v=Math.max(3,(s.parasPerPage||8)-1);setVal("parasPerPage",v);}} style={{width:28,height:28,borderRadius:14,background:t.solid,border:"1px solid "+t.borderSub,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,cursor:"pointer",color:t.text}}>{"-"}</div>
            <span style={{fontSize:14,fontWeight:600,color:t.accent,minWidth:20,textAlign:"center"}}>{s.parasPerPage||8}</span>
            <div onClick={function(){var v=Math.min(30,(s.parasPerPage||8)+1);setVal("parasPerPage",v);}} style={{width:28,height:28,borderRadius:14,background:t.solid,border:"1px solid "+t.borderSub,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,cursor:"pointer",color:t.text}}>{"+"}</div>
          </div>
        </div>
      </G>

      {/* Theme */}
      <G s={{padding:16,marginBottom:12}}>
        <div style={{fontSize:13,fontWeight:600,color:t.text,marginBottom:12}}>{"\u4E3B\u9898"}</div>
        <div style={{display:"flex",gap:8}}>
          {themes.map(function(th,i){return(
            <div key={i} onClick={function(){setVal("themeIndex",i);}} style={{flex:1,padding:"12px 8px",borderRadius:14,cursor:"pointer",textAlign:"center",background:i===s.themeIndex?t.solid:"transparent",border:i===s.themeIndex?"2px solid "+th.accent:"1px solid rgba(0,0,0,0.06)"}}>
              <div style={{fontSize:20,marginBottom:4}}>{th.emoji}</div>
              <div style={{fontSize:13,fontWeight:i===s.themeIndex?700:400,color:i===s.themeIndex?th.accent:"#aaa"}}>{th.name}</div>
            </div>);
          })}
        </div>
      </G>

      {/* Bubbles */}
      <G s={{padding:16,marginBottom:12}}>
        <div style={{fontSize:13,fontWeight:600,color:t.text,marginBottom:12}}>{"\u6C14\u6CE1\u914D\u8272"}</div>
        <div style={{display:"flex",gap:6}}>
          {bubblePresets.map(function(b,i){return(
            <div key={i} onClick={function(){setVal("bubbleIndex",i);}} style={{flex:1,padding:"8px 2px",borderRadius:10,cursor:"pointer",textAlign:"center",border:i===s.bubbleIndex?"2px solid #E09090":"1px solid rgba(0,0,0,0.06)"}}>
              <div style={{fontSize:13,marginBottom:2}}>{b.emoji}</div>
              <div style={{display:"flex",gap:2,justifyContent:"center",marginBottom:2}}><div style={{width:12,height:12,borderRadius:6,background:b.user}}/><div style={{width:12,height:12,borderRadius:6,background:b.ai}}/></div>
              <div style={{fontSize:8,color:"#9C9490"}}>{b.name}</div>
            </div>);
          })}
        </div>
        <div style={{marginTop:12}}>
          <div style={{display:"flex",justifyContent:"flex-end",marginBottom:6}}><div style={{background:bubblePresets[s.bubbleIndex||1].user,color:bubblePresets[s.bubbleIndex||1].userText,borderRadius:"12px 12px 4px 12px",padding:"8px 12px",fontSize:12}}>{"\u9884\u89C8\u6D88\u606F\uFF5E"}</div></div>
          <div style={{display:"flex"}}><div style={{background:bubblePresets[s.bubbleIndex||1].ai,color:bubblePresets[s.bubbleIndex||1].aiText,borderRadius:"12px 12px 12px 4px",padding:"8px 12px",fontSize:12}}>{"AI\u56DE\u590D \uD83D\uDE0A"}</div></div>
        </div>
      </G>

      {/* AI Toggles */}
      <G s={{padding:16,marginBottom:12}}>
        <div style={{fontSize:13,fontWeight:600,color:t.text,marginBottom:8}}>{"\uD83E\uDD16 AI \u529F\u80FD\u5F00\u5173"}</div>
        <ToggleRow k="aiStoryEnabled" label={"\uD83C\uDFA4 AI\u8BB2\u6545\u4E8B"} desc={"\u7528\u5927\u767D\u8BDD\u8BB2\u89E3\u6BCF\u6BB5\u5185\u5BB9"}/>
        <ToggleRow k="aiAnnotationEnabled" label={"\uD83D\uDCDD AI\u5171\u8BFB\u6279\u6CE8"} desc={"AI\u81EA\u7531\u9009\u62E9\u6BB5\u843D\u7559\u8A00"}/>
        <ToggleRow k="aiDiscussEnabled" label={"\uD83D\uDCAC \u9009\u6BB5\u8BA8\u8BBA"} desc={"\u9488\u5BF9\u67D0\u6BB5\u548CAI\u5B9E\u65F6\u804A\u5929"} last/>
      </G>

      {/* Prompt Templates */}
      <G s={{padding:16,marginBottom:12}}>
        <div style={{fontSize:13,fontWeight:600,color:t.text,marginBottom:4}}>{"\uD83D\uDCDD Prompt \u6A21\u677F"}</div>
        <div style={{fontSize:10,color:t.sub,marginBottom:8}}>{"\u9009\u62E9\u6216\u81EA\u5B9A\u4E49AI\u8BB2\u6545\u4E8B\u65F6\u7528\u7684\u8BF4\u8BDD\u98CE\u683C"}</div>
        {(s.promptTemplates||[]).map(function(pt,i){
          var active=i===(s.activePromptIndex||0);
          var isEditing=s._editingPrompt===i;
          return (<div key={i} style={{padding:"10px 14px",borderRadius:12,marginBottom:6,background:active?t.accentLight:"rgba(0,0,0,0.02)",border:active?"1px solid "+t.accent+"44":"1px solid rgba(0,0,0,0.04)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div onClick={function(){setVal("activePromptIndex",i);}} style={{flex:1,cursor:"pointer"}}>
                <div style={{fontSize:13,fontWeight:active?600:400,color:active?t.accent:t.text}}>{pt.name}</div>
                {!isEditing&&<div style={{fontSize:11,color:t.sub,marginTop:2,lineHeight:1.4}}>{pt.prompt.substring(0,60)+"..."}</div>}
              </div>
              <div style={{display:"flex",gap:6}}>
                <div onClick={function(){setVal("_editingPrompt",isEditing?-1:i);}} style={{fontSize:11,color:t.sub,cursor:"pointer",padding:"2px 6px"}}>{isEditing?"\u2714":"\u270F\uFE0F"}</div>
                {(s.promptTemplates||[]).length>1&&<div onClick={function(){if(!confirm("\u5220\u9664\u8FD9\u4E2A\u6A21\u677F\uFF1F")) return; var arr=(s.promptTemplates||[]).slice(); arr.splice(i,1); var ns=Object.assign({},s); ns.promptTemplates=arr; if(ns.activePromptIndex>=arr.length) ns.activePromptIndex=0; p.onUpdate(ns);}} style={{fontSize:11,color:"#C33",cursor:"pointer",padding:"2px 6px"}}>{"\u2715"}</div>}
              </div>
            </div>
            {isEditing&&(
              <div style={{marginTop:8}}>
                <input value={pt.name} onChange={function(e){var arr=(s.promptTemplates||[]).slice(); arr[i]=Object.assign({},arr[i],{name:e.target.value}); setVal("promptTemplates",arr);}} placeholder={"\u6A21\u677F\u540D\u79F0"} style={{width:"100%",padding:"8px 12px",borderRadius:10,background:"rgba(0,0,0,0.02)",border:"1px solid rgba(0,0,0,0.06)",fontSize:12,color:t.text,outline:"none",marginBottom:6,fontFamily:"inherit"}}/>
                <textarea value={pt.prompt} onChange={function(e){var arr=(s.promptTemplates||[]).slice(); arr[i]=Object.assign({},arr[i],{prompt:e.target.value}); setVal("promptTemplates",arr);}} placeholder={"\u5199\u4E0B\u4F60\u7684prompt..."} style={{width:"100%",minHeight:60,padding:"8px 12px",borderRadius:10,background:"rgba(0,0,0,0.02)",border:"1px solid rgba(0,0,0,0.06)",fontSize:12,color:t.text,outline:"none",resize:"vertical",fontFamily:"inherit",lineHeight:1.5}}/>
              </div>
            )}
          </div>);
        })}
        <div onClick={function(){var arr=(s.promptTemplates||[]).slice(); arr.push({name:"\u81EA\u5B9A\u4E49\u6A21\u677F",prompt:""}); var ns=Object.assign({},s); ns.promptTemplates=arr; ns._editingPrompt=arr.length-1; p.onUpdate(ns);}} style={{padding:"8px 14px",borderRadius:12,cursor:"pointer",textAlign:"center",fontSize:12,color:t.accent,border:"1px dashed "+t.accent+"44",background:"transparent"}}>{"\u2795 \u65B0\u589E\u81EA\u5B9A\u4E49\u6A21\u677F"}</div>
        <div style={{marginTop:12}}>
          <div style={{fontSize:12,color:t.text,fontWeight:500,marginBottom:4}}>{"\u6279\u6CE8Prompt"}</div>
          <textarea value={s.annotationPrompt||""} onChange={function(e){setVal("annotationPrompt",e.target.value);}} style={{width:"100%",minHeight:60,padding:"10px 14px",borderRadius:12,background:"rgba(0,0,0,0.02)",border:"1px solid rgba(0,0,0,0.06)",fontSize:12,color:t.text,outline:"none",resize:"vertical",fontFamily:"inherit",lineHeight:1.5}}/>
        </div>
      </G>

      {/* Export/Import */}
      <G s={{padding:16}}>
        <div style={{fontSize:13,fontWeight:600,color:t.text,marginBottom:8}}>{"\uD83D\uDCE6 \u6570\u636E"}</div>
        <div style={{display:"flex",gap:8}}>
          <div onClick={async function(){var data=await exportData();var blob=new Blob([data],{type:"application/json"});var url=URL.createObjectURL(blob);var a=document.createElement("a");a.href=url;a.download="reading-app-backup.json";a.click();URL.revokeObjectURL(url);}} style={{flex:1,textAlign:"center",padding:"10px 0",borderRadius:12,cursor:"pointer",fontSize:12,fontWeight:500,background:t.accent+"15",color:t.accent,border:"1px solid "+t.accent+"33"}}>{"\uD83D\uDCE4 \u5BFC\u51FA\u4E66\u67B6"}</div>
          <label style={{flex:1,textAlign:"center",padding:"10px 0",borderRadius:12,cursor:"pointer",fontSize:12,fontWeight:500,background:t.fresh+"15",color:t.fresh,border:"1px solid "+t.fresh+"33"}}>
            {"\uD83D\uDCE5 \u5BFC\u5165\u6570\u636E"}
            <input type="file" accept=".json" onChange={async function(e){var file=e.target.files[0];if(!file) return;var reader=new FileReader();reader.onload=async function(ev){await importData(ev.target.result);window.location.reload();};reader.readAsText(file);}} style={{display:"none"}}/>
          </label>
        </div>
      </G>
    </div>
  );
}

/* ================================================================
   MAIN APP
   ================================================================ */
export default function App() {
  var _p=useState("shelf"); var page=_p[0]; var setPage=_p[1];
  var _books=useState([]); var books=_books[0]; var setBooks=_books[1];
  var _s=useState(defaultSettings); var settings=_s[0]; var setSettings=_s[1];
  var _bid=useState(null); var bookId=_bid[0]; var setBookId=_bid[1];
  var _chs=useState([]); var chapters=_chs[0]; var setChapters=_chs[1];
  var _cid=useState(null); var chId=_cid[0]; var setChId=_cid[1];
  var _loading=useState(true); var loading=_loading[0]; var setLoading=_loading[1];

  var t=themes[settings.themeIndex||0];
  var curBook=books.find(function(b){return b.id===bookId;});
  var curCh=chapters.find(function(c){return c.id===chId;});

  useEffect(function(){
    (async function(){
      try {
        var bks=await getAllBooks(); setBooks(bks);
        var saved=await getSetting("userSettings");
        if(saved) setSettings(Object.assign({},defaultSettings,saved));
      } catch(e) { console.error("DB init error:",e); }
      setLoading(false);
    })();
  },[]);

  useEffect(function(){ if(!loading) setSetting("userSettings",settings); },[settings,loading]);

  function go(pg) { setPage(pg); window.scrollTo(0,0); }

  async function loadChapters(bId) { var chs=await getChaptersByBook(bId); setChapters(chs); return chs; }

  async function openBook(bId) { setBookId(bId); await loadChapters(bId); go("chapters"); }

  async function openChapter(cId) {
    setChId(cId);
    var bk=books.find(function(b){return b.id===bookId;});
    if(bk) { bk.lastReadAt=Date.now(); await updateBook(bk); setBooks(books.map(function(b){return b.id===bk.id?bk:b;})); }
    go("reader");
  }

  async function markRead(cId) {
    var ch=chapters.find(function(c){return c.id===cId;}); if(!ch) return;
    ch.isRead=true; await updateChapter(ch);
    setChapters(chapters.map(function(c){return c.id===cId?ch:c;}));
    var bk=books.find(function(b){return b.id===bookId;});
    if(bk) { bk.readCount=chapters.filter(function(c){return c.id===cId?true:c.isRead;}).length; await updateBook(bk); setBooks(books.map(function(b){return b.id===bk.id?bk:b;})); }
  }

  async function handleDelete(bId) { await deleteBook(bId); setBooks(books.filter(function(b){return b.id!==bId;})); }

  async function handleUpload(parsed) {
    var bookData={title:parsed.title,format:"txt",totalChapters:parsed.chapters.length,readCount:0,colorIndex:Math.floor(Math.random()*3),createdAt:Date.now(),lastReadAt:Date.now()};
    var bId=await addBook(bookData); bookData.id=bId;
    for(var i=0;i<parsed.chapters.length;i++) {
      await addChapter({bookId:bId,number:i+1,title:parsed.chapters[i].title,content:parsed.chapters[i].content,isRead:false,readingPosition:0});
    }
    setBooks(books.concat([bookData]));
  }

  function navChapter(cId) { setChId(cId); window.scrollTo(0,0); }

  if(loading) return (<div style={{minHeight:"100vh",background:t.bg,display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{fontSize:24}}>{"\uD83D\uDCDA"}</div></div>);

  return (
    <div style={{minHeight:"100vh",background:t.bg,padding:"6px 16px 48px",fontFamily:"'SF Pro Text','PingFang SC',-apple-system,'Noto Sans SC',sans-serif",transition:"background 0.4s",maxWidth:480,margin:"0 auto"}}>
      {page==="shelf"&&<ShelfPage t={t} books={books} settings={settings} onOpen={openBook} onDelete={handleDelete} onUpload={handleUpload} onSettings={function(){go("settings");}}/>}
      {page==="chapters"&&curBook&&<ChaptersPage t={t} book={curBook} chapters={chapters} onBack={function(){go("shelf");}} onOpenChapter={openChapter}/>}
      {page==="reader"&&curBook&&curCh&&<ReaderPage t={t} book={curBook} chapter={curCh} allChapters={chapters} settings={settings} onBack={function(){go("chapters");}} onMarkRead={markRead} onNav={navChapter}/>}
      {page==="settings"&&<SettingsPage t={t} settings={settings} onUpdate={function(ns){setSettings(ns);}} onBack={function(){go("shelf");}}/>}
    </div>
  );
}
