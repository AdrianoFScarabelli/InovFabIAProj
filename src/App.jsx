import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Relogio from './Relogio';
import './App.css';

const App = () => {
  const imagens = [
    '/foto1.jpg',
    '/foto2.jpg',
    '/foto3.jpg',
    '/foto4.jpg',
    '/foto5.jpg',
  ];

  const [indexAtual, setIndexAtual] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const intervalo = setInterval(() => {
      setIndexAtual((prevIndex) =>
        prevIndex === imagens.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000);

    return () => clearInterval(intervalo);
  }, [imagens.length]);

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8080');

    socket.onopen = () => {
      console.log('✅ Conectado ao WebSocket (App.jsx)');
    };

    socket.onmessage = (event) => {
      console.log('📩 Mensagem recebida (App.jsx):', event.data);
      if (event.data === 'pressionado') {
        
        navigate('/chat', { state: { iniciarGravacao: true } });
      }
    };

    socket.onerror = (error) => {
      console.error('❌ Erro WebSocket (App.jsx):', error);
    };

    socket.onclose = () => {
      console.warn('⚠️ WebSocket desconectado (App.jsx)');
    };

    return () => {
      socket.close();
    };
  }, [navigate]);

  const handleTitleClick = () => {
    navigate('/chat', { state: { iniciarGravacao: true } });
  };

  return (
    <div>
      <div className="relogio-container">
        <Relogio />
      </div>

      <div className="slider-container">
        <img
          src={imagens[indexAtual]}
          alt="Imagem rotativa"
          className="slider-image"
        />
      </div>

      <div className="welcome-container">
        <h1
          className="welcome"
          onClick={handleTitleClick}
          style={{ cursor: 'pointer' }}
        >
          Bem-vindo, aperte o botão do totem para iniciar uma conversa com o InovFabIA
        </h1>
      </div>
    </div>
  );
};

export default App;