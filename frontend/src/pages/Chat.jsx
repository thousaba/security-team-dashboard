import React, { useEffect, useRef, useState } from 'react'
import api from '../api';
import createEcho from '../echo';
import { useOutletContext } from 'react-router-dom';

function Chat() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const echoRef = useRef(null);
  const [me, setMe] = useState(null);
  const bottomRef = useRef(null);
  const {echo} = useOutletContext()

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
    if (!echo) return

    const handler = (e) => {
      setMessages(prev => prev.some(m => m.id === e.id) ? prev : [...prev, e])
    }
    const channel = echo.private('chat')
    channel.listen('MessageSent', handler)

    return () => channel.stopListening('MessageSent', handler)
  }, [echo])

  const handleSubmit = async (e) => {
    e.preventDefault();
    const response = await api.post('/chat', {content: text}, {
      headers: { 'X-Socket-ID': echo?.socketId() },
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