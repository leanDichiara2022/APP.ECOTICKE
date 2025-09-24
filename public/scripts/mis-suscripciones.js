document.addEventListener('DOMContentLoaded', async () => {
    try {
      const res = await fetch('/listar-suscripciones');
      const suscripciones = await res.json();
  
      const tbody = document.getElementById('suscripciones-body');
      tbody.innerHTML = '';
  
      suscripciones.forEach(s => {
        const fila = document.createElement('tr');
  
        fila.innerHTML = `
          <td>${s.planNombre}</td>
          <td>${s.estado}</td>
          <td>${new Date(s.fechaInicio).toLocaleDateString()}</td>
          <td>${new Date(s.fechaFin).toLocaleDateString()}</td>
        `;
  
        tbody.appendChild(fila);
      });
  
    } catch (error) {
      console.error('❌ Error al cargar las suscripciones:', error);
    }
  });
  