import React from 'react';
import './App.css';
import Component from './Component';

export const App = () => {
  return (
    <div className="container">
      <h1>Demo App</h1>
      <Component.InputForm />
    </div>
  )
}