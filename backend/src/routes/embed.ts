import { Request, Response, Router } from 'express';

const router = Router();

router.get('/agent/:agentId.js', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/javascript');
  const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';
  const script = `
(function(){
  var s=document.currentScript; if(!s) return;
  var cfg={
    agentId: s.dataset.agentId || '${req.params.agentId}',
    position: (s.dataset.position||'right').toLowerCase(),
    theme: (s.dataset.theme||'dark').toLowerCase(),
    primaryColor: s.dataset.primaryColor||'#2563eb',
    title: s.dataset.title||'Chat',
    bubbleColor: s.dataset.bubbleColor||'#2563eb',
    offsetX: parseInt(s.dataset.offsetX||'20'),
    offsetY: parseInt(s.dataset.offsetY||'20'),
    fontFamily: s.dataset.fontFamily||'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial',
    bubbleIcon: s.dataset.bubbleIcon||'chat',
    bubbleText: s.dataset.bubbleText||'Chat'
  };
  
  var container=document.createElement('div');
  container.style.position='fixed';
  container.style.zIndex='2147483647';
  container.style.bottom=cfg.offsetY+'px';
  if(cfg.position==='left'){ container.style.left=cfg.offsetX+'px'; } else { container.style.right=cfg.offsetX+'px'; }
  
  var iframe=document.createElement('iframe');
  iframe.style.border='0';
  iframe.style.width='360px';
  iframe.style.height='560px';
  iframe.style.borderRadius='12px';
  iframe.style.boxShadow='0 10px 30px rgba(0,0,0,0.35)';
  iframe.allow='clipboard-write; microphone;';
  var url='${frontend}/public/agent/'+encodeURIComponent(cfg.agentId)+
    '?theme='+encodeURIComponent(cfg.theme)+
    '&primaryColor='+encodeURIComponent(cfg.primaryColor)+
    '&title='+encodeURIComponent(cfg.title);
  iframe.src=url;

  // Floating button toggle
  var button=document.createElement('div');
  button.style.width='56px';
  button.style.height='56px';
  button.style.borderRadius='50%';
  button.style.background=cfg.bubbleColor;
  button.style.boxShadow='0 10px 30px rgba(0,0,0,0.35)';
  button.style.cursor='pointer';
  button.style.display='flex';
  button.style.alignItems='center';
  button.style.justifyContent='center';
  button.style.color='#fff';
  button.style.fontFamily=cfg.fontFamily;
  button.style.fontWeight='600';
  button.style.fontSize='14px';
  
  // Icon mapping
  var iconMap={
    'chat': '💬',
    'message': '✉️',
    'help': '❓',
    'support': '🆘',
    'question': '💭',
    'bot': '🤖'
  };
  
  var iconText=iconMap[cfg.bubbleIcon.toLowerCase()]||cfg.bubbleText||'Chat';
  if(iconText.length>2){ button.textContent=iconText; } else { button.innerHTML=iconText; }

  var opened=false;
  var panel=document.createElement('div');
  panel.style.display='none';
  panel.appendChild(iframe);

  button.addEventListener('click', function(){
    opened=!opened;
    panel.style.display = opened ? 'block' : 'none';
    iframe.style.display = opened ? 'block' : 'none';
  });

  container.appendChild(panel);
  container.appendChild(button);
  document.body.appendChild(container);
})();
`;
  res.send(script);
});

export default router;


