import React, { useState, useEffect } from 'react';
import './Relogio.css';

const Relogio = () => {
  const [dataAtual, setDataAtual] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setDataAtual(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const hora = dataAtual.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const data = dataAtual.toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="relogio-container">
      <div className="hora">{hora}</div>
      <div className="data">{data}</div>
    </div>
  );
};

export default Relogio;