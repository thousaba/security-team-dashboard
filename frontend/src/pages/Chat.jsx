import React, { useEffect, useRef, useState } from 'react'
import api from '../api';
import createEcho from '../echo';

function Chat() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const echoRef = useRef(null);
  const [me, setMe] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])


  useEffect(()=> {
    api.get('/chat')
      .then(response => setMessages(response.data))
      .catch(error => console.log('HATA', error))
  }, [])

  useEffect(()=> {
    api.get('/profile').then(response => setMe(response.data))
  }, [])

  useEffect(()=> {
    const echo = createEcho()
    echoRef.current = echo

    echo.private('chat').listen('MessageSent', (e)=> {
      setMessages(prev => prev.some(m => m.id === e.id) ? prev : [...prev, e])
    })
    return () => echo.disconnect()

  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault();
    const response = await api.post('/chat', {content: text}, {
      headers: { 'X-Socket-ID': echoRef.current?.socketId() },
    });
    setMessages(prev => [...prev, response.data]);
    setText('');
  };


  return (
    <div className='chat-page'>
    <div className='chat-box'>
      <div className='message-list'>
        {messages.map(message => {
          const isMine = message.user_id === me?.id
          return (
            <div key={message.id} className={`message ${isMine ? 'mine' : 'theirs'}`}>
              {!isMine && <strong>{message.user}</strong>}
              <p>{message.content}</p>
              <small>{new Date(message.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</small>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <form className='chat-form' onSubmit={handleSubmit}>
        <input value={text} onChange={e => setText(e.target.value)} />
        <button type='submit'>Gönder</button>
      </form>
    </div>
    </div>
  )
}

export default Chat