import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Relogio from './Relogio';
import './Chat.css';

const Chat = () => {
  const gifs = ['/escutando.gif', '/processando.gif', '/respondendo.gif', '/pause.png'];
  const [gifIndex, setGifIndex] = useState(0);
  const [gravando, setGravando] = useState(false);
  const [mensagens, setMensagens] = useState([]);
  const mensagensRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    if (mensagensRef.current) {
      mensagensRef.current.scrollTop = mensagensRef.current.scrollHeight;
    }
  }, [mensagens]);

  useEffect(() => {
    if (location.state?.iniciarGravacao) {
      startGravacao();
    }
  }, [location.state]);

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8080');

    socket.onopen = () => {
      console.log('✅ WebSocket ativo em Chat.jsx');
      setGifIndex(3);
    };

    socket.onmessage = (event) => {
      console.log('📩 Mensagem recebida no Chat.jsx:', event.data);
      if (event.data === 'pressionado') {
        startGravacao();
      }
    };

    socket.onerror = (error) => {
      console.error('❌ Erro WebSocket em Chat.jsx:', error);
    };

    socket.onclose = () => {
      console.warn('⚠️ WebSocket desconectado em Chat.jsx');
    };

    return () => socket.close();
  }, []);

  useEffect(() => {
    if (mensagens.length === 0) return;

    const timeout = setTimeout(() => {
      console.log('⏳ Inatividade detectada, retornando à tela inicial...');
      navigate('/');
    }, 30000);

    return () => clearTimeout(timeout);
  }, [mensagens, navigate]);

  useEffect(() => {

    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.getVoices();
    };
  }, []);

  const getVozFeminina = () => {
    const voices = window.speechSynthesis.getVoices();
    return voices.find(voice =>
      voice.lang === 'pt-BR' &&
      /female|mulher|maria|brasil/i.test(voice.name)
    ) || voices.find(voice => voice.lang === 'pt-BR');
  };

  const enviarPergunta = async (textoPergunta) => {
  setGifIndex(1);

  try {
    const response = await fetch('http://127.0.0.1:8000/speech/process-file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pergunta: textoPergunta }),
    });

    if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);

    const data = await response.json();
    const textoResposta = data.result?.content || 'Sem resposta da API';

    setMensagens(prev => [...prev, { pergunta: textoPergunta, resposta: textoResposta }]);

    const utterance = new SpeechSynthesisUtterance(textoResposta);
    utterance.lang = 'pt-BR';
    utterance.voice = getVozFeminina();

    utterance.onstart = () => setGifIndex(2);
    utterance.onend = () => setGifIndex(0);

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);

  } catch (error) {
    console.error('Erro na LLM:', error);
    const erroMsg = 'Erro ao conectar com a API.';
    setMensagens(prev => [...prev, { pergunta: textoPergunta, resposta: erroMsg }]);

    const utteranceErro = new SpeechSynthesisUtterance(erroMsg);
    utteranceErro.lang = 'pt-BR';
    utteranceErro.voice = getVozFeminina();

    utteranceErro.onstart = () => setGifIndex(2);
    utteranceErro.onend = () => setGifIndex(0);

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utteranceErro);
    }
  };

  const startGravacao = () => {
    if (gravando) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.error('Reconhecimento de voz não suportado neste navegador.');
      setMensagens(prev => [...prev, { pergunta: 'Erro: navegador sem suporte ao reconhecimento de voz.', resposta: '' }]);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    
    setGifIndex(0);
    setGravando(true);

    recognition.onstart = () => {
      console.log('🎙️ Reconhecimento de voz iniciado');
      setGifIndex(0);
    };

    recognition.onresult = async (event) => {
      const texto = event.results[0][0].transcript;
      console.log('🗣️ Texto reconhecido:', texto);
      await enviarPergunta(texto);
      setGravando(false);
    };

    recognition.onerror = (event) => {
      console.error('❌ Erro no reconhecimento:', event.error);
      setMensagens(prev => [...prev, { pergunta: 'Erro ao reconhecer voz.', resposta: 'Erro na transcrição.' }]);
      setGravando(false);
      setGifIndex(0);
    };

    recognition.onend = () => {
      if (gravando) {
        setGravando(false);
      }
    };

    recognition.start();
  };


  const handleLogoClick = () => {
    navigate('/');
  };

  const handleGifClick = () => {
    startGravacao();
  };

  return (
    <div>
      <div className="logo-container">
        <img
          src="/logo.svg"
          alt="Logo do InovFabLab"
          className="logo"
          onClick={handleLogoClick}
          style={{ cursor: 'pointer' }}
        />
      </div>

      <div className="relogio-container">
        <Relogio />
      </div>

      <div className="titulo-container">
        <h1 className="titulo">Bem-vindo ao InovFabIA</h1>
      </div>

      <div className="chat-container" ref={mensagensRef}>
        {mensagens.map((msg, i) => (
          <div key={i} className="mensagem">
            <p className="perguntas"><strong>Você:</strong> {msg.pergunta}</p>
            <p className="resposta"><strong>InovFabIA:</strong> {msg.resposta} <br/><br/>Quer realizar outra pergunta? Aperte o botão do totem novamente.</p>
          </div>
        ))}
      </div>

      <div className="resposta-container">
        <img
          src={gifs[gifIndex]}
          alt={`animação ${gifIndex}`}
          className="gif"
          onClick={handleGifClick}
          style={{ cursor: 'pointer' }}
        />
      </div>
    </div>
  );
};

export default Chat;
