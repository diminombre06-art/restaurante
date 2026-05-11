import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

// CAMBIA 'localhost' por tu IP para usar con el celular
const socket = io('https://restaurante-production-305e.up.railway.app', {
  transports: ['websocket', 'polling']
});

const MENU_GURMET = [
  { categoria: "🥗 Entradas", items: [
    { id: 1, nombre: "Crema de champiñones", precio: 85 },
    { id: 2, nombre: "Sopa de tortilla", precio: 75 },
    { id: 3, nombre: "Ensalada mediterránea", precio: 120 },
    { id: 4, nombre: "Pan de ajo artesanal", precio: 65 },
    { id: 5, nombre: "Tabla de quesos y frutas", precio: 210 }
  ]},
  { categoria: "🍲 Sopas y Cremas", items: [
    { id: 6, nombre: "Sopa azteca", precio: 80 },
    { id: 7, nombre: "Crema de elote", precio: 80 },
    { id: 8, nombre: "Consomé de pollo", precio: 70 },
    { id: 9, nombre: "Crema de espinaca", precio: 80 }
  ]},
  { categoria: "🥩 Platillos Principales", items: [
    { id: 10, nombre: "Pechuga rellena en chipotle", precio: 185 },
    { id: 11, nombre: "Filete de res con verduras", precio: 245 },
    { id: 12, nombre: "Salmón al limón", precio: 260 },
    { id: 13, nombre: "Pollo en salsa de champiñones", precio: 175 },
    { id: 14, nombre: "Medallones de cerdo BBQ", precio: 195 },
    { id: 15, nombre: "Arrachera con puré", precio: 230 }
  ]},
  { categoria: "🍝 Pastas", items: [
    { id: 16, nombre: "Fettuccine Alfredo", precio: 160 },
    { id: 17, nombre: "Espagueti a la boloñesa", precio: 155 },
    { id: 18, nombre: "Pasta al pesto", precio: 150 },
    { id: 19, nombre: "Lasaña tradicional", precio: 175 }
  ]},
  { categoria: "🌮 Cocina Mexicana", items: [
    { id: 20, nombre: "Enchiladas suizas", precio: 145 },
    { id: 21, nombre: "Chile relleno", precio: 135 },
    { id: 22, nombre: "Mole poblano con arroz", precio: 165 },
    { id: 23, nombre: "Tacos de arrachera", precio: 180 },
    { id: 24, nombre: "Chiles en nogada", precio: 210 }
  ]},
  { categoria: "🍰 Postres", items: [
    { id: 25, nombre: "Cheesecake de frutos rojos", precio: 95 },
    { id: 26, nombre: "Flan napolitano", precio: 65 },
    { id: 27, nombre: "Pastel tres leches", precio: 85 },
    { id: 28, nombre: "Brownie artesanal", precio: 80 },
    { id: 29, nombre: "Pay de limón", precio: 75 }
  ]},
  { categoria: "☕ Bebidas", items: [
    { id: 30, nombre: "Agua fresca del día", precio: 40 },
    { id: 31, nombre: "Limonada mineral", precio: 45 },
    { id: 32, nombre: "Café americano", precio: 35 },
    { id: 33, nombre: "Capuchino", precio: 55 },
    { id: 34, nombre: "Té helado", precio: 45 },
    { id: 35, nombre: "Jugo natural naranja", precio: 50 }
  ]}
];

const todosLosItems = MENU_GURMET.flatMap(cat => cat.items);

function App() {
  const [carrito, setCarrito] = useState({});
  const [pedidos, setPedidos] = useState([]);
  const [esCocina, setEsCocina] = useState(false);
  const [mostrarLogin, setMostrarLogin] = useState(false);
  const [mostrarExito, setMostrarExito] = useState(false);

  useEffect(() => {
    socket.on('lista-pedidos', (data) => setPedidos(data));
    return () => socket.off('lista-pedidos');
  }, []);

  const totalCuenta = todosLosItems.reduce((acc, item) => acc + (item.precio * (carrito[item.id] || 0)), 0);

  const enviarPedido = () => {
    const itemsSeleccionados = todosLosItems
      .filter(i => carrito[i.id] > 0)
      .map(i => ({ nombre: i.nombre, cant: carrito[i.id] }));

    const nuevaOrden = {
      id: Date.now(),
      items: itemsSeleccionados,
      total: totalCuenta,
      hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    socket.emit('nuevo-pedido', nuevaOrden);
    setCarrito({});
    setMostrarExito(true);
  };

  const cambiarEstado = (id, nuevoEstado) => {
    socket.emit('actualizar-estado', { id, nuevoEstado });
  };

  if (esCocina) {
    const filtrar = (estado) => pedidos.filter(p => (p.estado || 'pendiente') === estado);
    
    // LOGICA DE CUENTA (CORTE DE CAJA)
    const pedidosEntregados = pedidos.filter(p => p.estado === 'entregado');
    const totalVentas = pedidosEntregados.reduce((acc, p) => acc + p.total, 0);
    const productosVendidos = pedidosEntregados.flatMap(p => p.items).reduce((acc, item) => {
        acc[item.nombre] = (acc[item.nombre] || 0) + item.cant;
        return acc;
    }, {});

    const mostrarReporte = () => {
        const detalle = Object.entries(productosVendidos).map(([n, c]) => `${n}: ${c} und.`).join('\n');
        alert(`📊 CORTE DE CAJA\n\nTotal Recaudado: $${totalVentas}.00\nPedidos Finalizados: ${pedidosEntregados.length}\n\nDetalle de Ventas:\n${detalle || 'Sin ventas aún'}`);
    };

    return (
      <div style={{ backgroundColor: '#f4f1ea', minHeight: '100vh', padding: '20px', fontFamily: 'serif' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1 style={{ color: '#3e2723' }}>👨‍🍳 Panel de Comandas</h1>
          <div>
            <button onClick={mostrarReporte} style={{...btnGourmet('#5d4037'), marginRight: '10px'}}>📊 Corte de Caja</button>
            <button onClick={() => setEsCocina(false)} style={btnGourmet('#3e2723')}>Cerrar Sesión</button>
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          <div style={columnaStyle}><h2 style={{ color: '#c62828', textAlign: 'center' }}>📥 Nuevos</h2>
            {filtrar('pendiente').map(p => (
              <div key={p.id} style={ticketCocina('#c62828')}>
                <div><b>{p.hora}</b></div>
                {p.items.map((it, i) => <div key={i}>{it.cant}x {it.nombre}</div>)}
                <button onClick={() => cambiarEstado(p.id, 'transito')} style={btnAccion('#5d4037')}>Preparar ➔</button>
              </div>
            ))}
          </div>

          <div style={columnaStyle}><h2 style={{ color: '#ef6c00', textAlign: 'center' }}>🔥 Cocinando</h2>
            {filtrar('transito').map(p => (
              <div key={p.id} style={ticketCocina('#ef6c00')}>
                <div><b>{p.hora}</b></div>
                {p.items.map((it, i) => <div key={i}>{it.cant}x {it.nombre}</div>)}
                <button onClick={() => cambiarEstado(p.id, 'entregado')} style={btnAccion('#2e7d32')}>Entregar ✅</button>
              </div>
            ))}
          </div>

          <div style={columnaStyle}><h2 style={{ color: '#2e7d32', textAlign: 'center' }}>🍽️ Listos</h2>
            {filtrar('entregado').map(p => (
              <div key={p.id} style={{ ...ticketCocina('#2e7d32'), opacity: 0.6 }}>
                <div>Total: ${p.total}</div>
                {p.items.map((it, i) => <div key={i} style={{ textDecoration: 'line-through' }}>{it.nombre}</div>)}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#fdfaf6', minHeight: '100vh', fontFamily: 'serif' }}>
      <header style={headerStyle}>
        <h1 style={{ margin: 0, letterSpacing: '3px' }}>CASA GOURMET</h1>
        <small onClick={() => setMostrarLogin(true)} style={{ cursor: 'pointer', opacity: 0.7 }}>Personal Autorizado</small>
      </header>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', paddingBottom: '120px' }}>
        {MENU_GURMET.map((cat, idx) => (
          <div key={idx} style={{ marginBottom: '40px' }}>
            <h2 style={categoriaStyle}>{cat.categoria}</h2>
            {cat.items.map(item => (
              <div key={item.id} style={itemFilaStyle}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', color: '#3e2723' }}>{item.nombre}</div>
                  <div style={{ color: '#8d6e63' }}>${item.precio}.00</div>
                </div>
                <div style={stepperStyle}>
                  <button onClick={() => setCarrito({...carrito, [item.id]: Math.max(0, (carrito[item.id] || 0) - 1)})} style={btnRound}>-</button>
                  <span style={{ minWidth: '25px', textAlign: 'center' }}>{carrito[item.id] || 0}</span>
                  <button onClick={() => setCarrito({...carrito, [item.id]: (carrito[item.id] || 0) + 1})} style={btnRound}>+</button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {totalCuenta > 0 && (
        <div style={barraPedido}>
          <button onClick={enviarPedido} style={btnConfirmar}>Enviar Orden • ${totalCuenta}.00</button>
        </div>
      )}

      {mostrarExito && (
        <div style={overlayStyle}>
          <div style={modalGourmet}>
            <h2>🛎️ ¡Orden Enviada!</h2>
            <p>Su pedido ya está en cocina.</p>
            <button onClick={() => setMostrarExito(false)} style={btnGourmet('#3e2723')}>Entendido</button>
          </div>
        </div>
      )}

      {mostrarLogin && (
        <div style={overlayStyle}>
          <div style={modalGourmet}>
            <h3>Acceso Staff</h3>
            <input type="password" placeholder="PIN" style={inputGourmet} onChange={(e) => e.target.value === "michi2026" && setEsCocina(true) & setMostrarLogin(false)} />
            <button onClick={() => setMostrarLogin(false)} style={{marginTop: '10px', background: 'none', border: 'none'}}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ESTILOS
const headerStyle = { textAlign: 'center', padding: '40px 20px', backgroundColor: '#3e2723', color: '#d7ccc8' };
const categoriaStyle = { borderBottom: '1px solid #d7ccc8', paddingBottom: '10px', color: '#3e2723', marginTop: '30px' };
const itemFilaStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0', borderBottom: '1px solid #eee' };
const stepperStyle = { display: 'flex', alignItems: 'center', gap: '10px' };
const btnRound = { width: '30px', height: '30px', borderRadius: '50%', border: '1px solid #3e2723', cursor: 'pointer', background: 'white' };
const barraPedido = { position: 'fixed', bottom: '20px', width: '100%', display: 'flex', justifyContent: 'center' };
const btnConfirmar = { backgroundColor: '#3e2723', color: '#d7ccc8', border: 'none', padding: '15px 40px', borderRadius: '30px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' };
const overlayStyle = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalGourmet = { backgroundColor: 'white', padding: '30px', borderRadius: '15px', textAlign: 'center', width: '300px' };
const inputGourmet = { padding: '10px', width: '100%', boxSizing: 'border-box', textAlign: 'center' };
const btnGourmet = (col) => ({ backgroundColor: col, color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer' });
const columnaStyle = { backgroundColor: '#eaddca', padding: '15px', borderRadius: '10px', minHeight: '70vh' };
const ticketCocina = (color) => ({ backgroundColor: 'white', padding: '15px', borderRadius: '8px', marginBottom: '10px', borderLeft: `6px solid ${color}` });
const btnAccion = (col) => ({ marginTop: '10px', width: '100%', padding: '8px', border: 'none', borderRadius: '4px', backgroundColor: col, color: 'white', cursor: 'pointer' });

export default App;