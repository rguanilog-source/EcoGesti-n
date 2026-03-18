// ==========================================
// VARIABLES GLOBALES
// ==========================================

let registrosResiduos = JSON.parse(localStorage.getItem('registrosResiduos')) || [];
let empresas = JSON.parse(localStorage.getItem('empresas')) || [];
let idRegistroEditar = null;

// Tipos de residuos por categoría
const tiposResiduos = {
    organico: ['Frutas y verduras', 'Huesos', 'Cáscaras', 'Restos de comida', 'Hojas y ramas'],
    plastico: ['Bolsas', 'Botellas', 'Envases', 'Empaques', 'Láminas'],
    metal: ['Latas', 'Tuberías', 'Alambres', 'Chatarra', 'Accesorios'],
    vidrio: ['Botellas', 'Tarros', 'Vasos', 'Vidrios planos', 'Espejos'],
    papel: ['Cajas', 'Cartón', 'Periódico', 'Papel de empaques', 'Archivos'],
    textil: ['Ropa', 'Telas', 'Trapos', 'Alfombras', 'Prendas usadas'],
    peligroso: ['Aceites', 'Baterías', 'Pilas', 'Químicos', 'Pesticidas']
};

// Colores para gráficos
const coloresGrafico = {
    organico: '#e8f5e9',
    plastico: '#e3f2fd',
    metal: '#f3e5f5',
    vidrio: '#e0f2f1',
    papel: '#fff3e0',
    textil: '#fce4ec',
    peligroso: '#ffebee'
};

// ==========================================
// FUNCIONES DE NAVEGACIÓN
// ==========================================

function showSection(sectionId) {
    // Ocultar todas las secciones
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => section.classList.remove('active'));

    // Mostrar la sección seleccionada
    document.getElementById(sectionId).classList.add('active');

    // Scroll al top
    window.scrollTo(0, 0);

    // Actualizar dashboard
    if (sectionId === 'dashboard') {
        actualizarDashboard();
    }

    // Actualizar historial
    if (sectionId === 'historial') {
        mostrarHistorial();
    }

    // Mostrar empresas
    if (sectionId === 'empresas') {
        mostrarEmpresas();
    }
}

// ==========================================
// FUNCIONES DEL DASHBOARD
// ==========================================

function actualizarDashboard() {
    // Calcular totales
    const totalResiduos = registrosResiduos.reduce((sum, r) => sum + parseFloat(r.cantidad), 0);
    const totalRegistros = registrosResiduos.length;
    const totalEmpresas = empresas.length;

    // Mostrar en tarjetas
    document.getElementById('totalResiduos').textContent = totalResiduos.toFixed(2) + ' kg';
    document.getElementById('totalRegistros').textContent = totalRegistros;
    document.getElementById('totalEmpresas').textContent = totalEmpresas;
    document.getElementById('residuosReutilizados').textContent = (totalResiduos * 0.85).toFixed(2) + ' kg';

    // Actualizar gráficos
    actualizarGraficoCategoria();
    actualizarGraficoTendencia();
}

function actualizarGraficoCategoria() {
    const ctx = document.getElementById('chartCategoria').getContext('2d');
    
    // Agrupar por categoría
    const categorias = {};
    registrosResiduos.forEach(r => {
        if (!categorias[r.categoria]) {
            categorias[r.categoria] = 0;
        }
        categorias[r.categoria] += parseFloat(r.cantidad);
    });

    const labels = Object.keys(categorias);
    const data = Object.values(categorias);
    const colores = labels.map(cat => {
        const colorMap = {
            'organico': '#27ae60',
            'plastico': '#3498db',
            'metal': '#9b59b6',
            'vidrio': '#1abc9c',
            'papel': '#e67e22',
            'textil': '#e74c3c',
            'peligroso': '#c0392b'
        };
        return colorMap[cat] || '#95a5a6';
    });

    // Destruir gráfico anterior si existe
    if (window.chartCategoria) {
        window.chartCategoria.destroy();
    }

    window.chartCategoria = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colores,
                borderColor: '#fff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function actualizarGraficoTendencia() {
    const ctx = document.getElementById('chartTendencia').getContext('2d');
    
    // Últimos 7 días
    const dias = [];
    const datos = [];
    
    for (let i = 6; i >= 0; i--) {
        const fecha = new Date();
        fecha.setDate(fecha.getDate() - i);
        const fechaStr = fecha.toISOString().split('T')[0];
        
        dias.push(fecha.toLocaleDateString('es-ES', { weekday: 'short' }));
        
        const totalDia = registrosResiduos
            .filter(r => r.fecha === fechaStr)
            .reduce((sum, r) => sum + parseFloat(r.cantidad), 0);
        
        datos.push(totalDia);
    }

    // Destruir gráfico anterior si existe
    if (window.chartTendencia) {
        window.chartTendencia.destroy();
    }

    window.chartTendencia = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dias,
            datasets: [{
                label: 'Residuos (kg)',
                data: datos,
                borderColor: '#2ecc71',
                backgroundColor: 'rgba(46, 204, 113, 0.1)',
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#2ecc71',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value + ' kg';
                        }
                    }
                }
            }
        }
    });
}

// ==========================================
// FUNCIONES DE REGISTRO DE RESIDUOS
// ==========================================

function actualizarTipos() {
    const categoria = document.getElementById('categoria').value;
    const selectTipo = document.getElementById('tipo');
    
    selectTipo.innerHTML = '<option value="">-- Seleccionar tipo --</option>';
    
    if (categoria && tiposResiduos[categoria]) {
        tiposResiduos[categoria].forEach(tipo => {
            const option = document.createElement('option');
            option.value = tipo.toLowerCase().replace(/\s+/g, '_');
            option.textContent = tipo;
            selectTipo.appendChild(option);
        });
    }
}

// Evento del formulario de registro
document.getElementById('formRegistroResiduos').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const registro = {
        id: Date.now(),
        mercado: document.getElementById('mercado').value,
        tipoMercado: document.getElementById('tipoMercado').value,
        categoria: document.getElementById('categoria').value,
        tipo: document.getElementById('tipo').value,
        cantidad: parseFloat(document.getElementById('cantidad').value),
        fecha: document.getElementById('fecha').value,
        descripcion: document.getElementById('descripcion').value
    };
    
    registrosResiduos.push(registro);
    localStorage.setItem('registrosResiduos', JSON.stringify(registrosResiduos));
    
    // Mostrar mensaje de éxito
    const mensaje = document.getElementById('mensajeRegistro');
    mensaje.textContent = '✅ Residuos registrados correctamente';
    mensaje.classList.add('exito');
    mensaje.classList.remove('error');
    
    setTimeout(() => {
        mensaje.classList.remove('exito');
    }, 3000);
    
    // Limpiar formulario
    this.reset();
    document.getElementById('tipo').innerHTML = '<option value="">-- Seleccionar tipo --</option>';
});

// Establecer fecha actual por defecto
document.getElementById('fecha').valueAsDate = new Date();

// ==========================================
// FUNCIONES DEL HISTORIAL
// ==========================================

function mostrarHistorial() {
    const cuerpo = document.getElementById('cuerpoTabla');
    
    if (registrosResiduos.length === 0) {
        cuerpo.innerHTML = '<tr><td colspan="8" class="sin-datos">No hay registros. ¡Comienza a registrar residuos!</td></tr>';
        return;
    }
    
    cuerpo.innerHTML = registrosResiduos.map((registro, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${registro.mercado}</td>
            <td>${registro.tipoMercado}</td>
            <td>${registro.categoria}</td>
            <td>${registro.tipo}</td>
            <td>${parseFloat(registro.cantidad).toFixed(2)}</td>
            <td>${registro.fecha}</td>
            <td>
                <button class="btn btn-secondary btn-small" onclick="abrirEditar(${registro.id})">✏️ Editar</button>
                <button class="btn btn-danger btn-small" onclick="eliminarRegistro(${registro.id})">🗑️ Eliminar</button>
            </td>
        </tr>
    `).join('');
}

function aplicarFiltros() {
    const filtroMercado = document.getElementById('filtroMercado').value.toLowerCase();
    const filtroCategoria = document.getElementById('filtroCategoria').value;
    
    const cuerpo = document.getElementById('cuerpoTabla');
    
    const registrosFiltrados = registrosResiduos.filter(registro => {
        return (
            registro.mercado.toLowerCase().includes(filtroMercado) &&
            (filtroCategoria === '' || registro.categoria === filtroCategoria)
        );
    });
    
    if (registrosFiltrados.length === 0) {
        cuerpo.innerHTML = '<tr><td colspan="8" class="sin-datos">No hay registros que coincidan con los filtros</td></tr>';
        return;
    }
    
    cuerpo.innerHTML = registrosFiltrados.map((registro, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${registro.mercado}</td>
            <td>${registro.tipoMercado}</td>
            <td>${registro.categoria}</td>
            <td>${registro.tipo}</td>
            <td>${parseFloat(registro.cantidad).toFixed(2)}</td>
            <td>${registro.fecha}</td>
            <td>
                <button class="btn btn-secondary btn-small" onclick="abrirEditar(${registro.id})">✏️ Editar</button>
                <button class="btn btn-danger btn-small" onclick="eliminarRegistro(${registro.id})">🗑️ Eliminar</button>
            </td>
        </tr>
    `).join('');
}

function limpiarFiltros() {
    document.getElementById('filtroMercado').value = '';
    document.getElementById('filtroCategoria').value = '';
    mostrarHistorial();
}

function abrirEditar(id) {
    const registro = registrosResiduos.find(r => r.id === id);
    
    if (registro) {
        idRegistroEditar = id;
        document.getElementById('editMercado').value = registro.mercado;
        document.getElementById('editCantidad').value = registro.cantidad;
        document.getElementById('editCategoria').value = registro.categoria;
        document.getElementById('modalEditar').style.display = 'block';
    }
}

function cerrarModal() {
    document.getElementById('modalEditar').style.display = 'none';
}

document.getElementById('formEditar').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const registro = registrosResiduos.find(r => r.id === idRegistroEditar);
    
    if (registro) {
        registro.mercado = document.getElementById('editMercado').value;
        registro.cantidad = parseFloat(document.getElementById('editCantidad').value);
        registro.categoria = document.getElementById('editCategoria').value;
        
        localStorage.setItem('registrosResiduos', JSON.stringify(registrosResiduos));
        
        cerrarModal();
        mostrarHistorial();
        
        const mensaje = document.getElementById('mensajeRegistro');
        mensaje.textContent = '✅ Registro actualizado correctamente';
        mensaje.classList.add('exito');
        setTimeout(() => mensaje.classList.remove('exito'), 3000);
    }
});

window.onclick = function(event) {
    const modal = document.getElementById('modalEditar');
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}

function eliminarRegistro(id) {
    if (confirm('¿Estás seguro de que deseas eliminar este registro?')) {
        registrosResiduos = registrosResiduos.filter(r => r.id !== id);
        localStorage.setItem('registrosResiduos', JSON.stringify(registrosResiduos));
        mostrarHistorial();
    }
}

// ==========================================
// FUNCIONES DE EMPRESAS
// ==========================================

document.getElementById('formAgregarEmpresa').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const empresa = {
        id: Date.now(),
        nombre: document.getElementById('nombreEmpresa').value,
        especializacion: document.getElementById('especializacion').value,
        telefono: document.getElementById('telefonoEmpresa').value,
        email: document.getElementById('emailEmpresa').value,
        ubicacion: document.getElementById('ubicacionEmpresa').value,
        descripcion: document.getElementById('descripcionEmpresa').value
    };
    
    empresas.push(empresa);
    localStorage.setItem('empresas', JSON.stringify(empresas));
    
    const mensaje = document.getElementById('mensajeEmpresa');
    mensaje.textContent = '✅ Empresa agregada correctamente';
    mensaje.classList.add('exito');
    mensaje.classList.remove('error');
    
    setTimeout(() => {
        mensaje.classList.remove('exito');
    }, 3000);
    
    this.reset();
    mostrarEmpresas();
});

function mostrarEmpresas() {
    const grid = document.getElementById('empresasGrid');
    
    if (empresas.length === 0) {
        grid.innerHTML = '<p class="sin-datos">No hay empresas registradas aún.</p>';
        return;
    }
    
    grid.innerHTML = empresas.map(empresa => `
        <div class="empresa-card">
            <h3>${empresa.nombre}</h3>
            <span class="especialidad">${empresa.especializacion}</span>
            <p><strong>📍 Ubicación:</strong> ${empresa.ubicacion}</p>
            <p><strong>📝 Descripción:</strong> ${empresa.descripcion}</p>
            <div class="contacto">
                <p><strong>📞 Tel:</strong> <a href="tel:${empresa.telefono}">${empresa.telefono}</a></p>
                <p><strong>📧 Email:</strong> <a href="mailto:${empresa.email}">${empresa.email}</a></p>
            </div>
            <button class="btn btn-danger btn-small" onclick="eliminarEmpresa(${empresa.id})" style="margin-top: 1rem;">🗑️ Eliminar</button>
        </div>
    `).join('');
    
    document.getElementById('totalEmpresas').textContent = empresas.length;
}

function eliminarEmpresa(id) {
    if (confirm('¿Estás seguro de que deseas eliminar esta empresa?')) {
        empresas = empresas.filter(e => e.id !== id);
        localStorage.setItem('empresas', JSON.stringify(empresas));
        mostrarEmpresas();
    }
}

// ==========================================
// FUNCIONES DE REPORTES
// ==========================================

function generarReporteGeneral() {
    const totalResiduos = registrosResiduos.reduce((sum, r) => sum + parseFloat(r.cantidad), 0);
    const totalRegistros = registrosResiduos.length;
    
    const categoriaResumen = {};
    registrosResiduos.forEach(r => {
        if (!categoriaResumen[r.categoria]) {
            categoriaResumen[r.categoria] = 0;
        }
        categoriaResumen[r.categoria] += parseFloat(r.cantidad);
    });
    
    let html = `
        <h2>Reporte General</h2>
        <div style="background: #f5f7fa; padding: 1.5rem; border-radius: 8px; margin: 1rem 0;">
            <p><strong>📊 Total de Residuos:</strong> ${totalResiduos.toFixed(2)} kg</p>
            <p><strong>📋 Total de Registros:</strong> ${totalRegistros}</p>
            <p><strong>📈 Promedio por Registro:</strong> ${(totalResiduos / totalRegistros).toFixed(2)} kg</p>
            <p><strong>♻️ Residuos Potencialmente Reutilizables:</strong> ${(totalResiduos * 0.85).toFixed(2)} kg</p>
        </div>
        
        <h3 style="margin-top: 2rem;">Residuos por Categoría</h3>
        <table class="tabla-datos reporte-tabla">
            <thead>
                <tr>
                    <th>Categoría</th>
                    <th>Cantidad (kg)</th>
                    <th>Porcentaje</th>
                    <th>Registros</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    Object.entries(categoriaResumen).forEach(([categoria, cantidad]) => {
        const porcentaje = ((cantidad / totalResiduos) * 100).toFixed(2);
        const registros = registrosResiduos.filter(r => r.categoria === categoria).length;
        html += `
            <tr>
                <td>${categoria}</td>
                <td>${parseFloat(cantidad).toFixed(2)} kg</td>
                <td>${porcentaje}%</td>
                <td>${registros}</td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
        <p style="margin-top: 1rem; color: #95a5a6; font-size: 0.9rem;">
            <strong>Generado:</strong> ${new Date().toLocaleString('es-ES')}
        </p>
    `;
    
    document.getElementById('contenidoReporte').innerHTML = html;
}

function generarReporteCategoria() {
    const categoriaResumen = {};
    
    registrosResiduos.forEach(r => {
        if (!categoriaResumen[r.categoria]) {
            categoriaResumen[r.categoria] = [];
        }
        categoriaResumen[r.categoria].push(r);
    });
    
    let html = '<h2>Reporte Detallado por Categoría</h2>';
    
    Object.entries(categoriaResumen).forEach(([categoria, registros]) => {
        const total = registros.reduce((sum, r) => sum + parseFloat(r.cantidad), 0);
        
        html += `
            <div style="background: #f5f7fa; padding: 1.5rem; border-radius: 8px; margin: 1.5rem 0; border-left: 4px solid #2ecc71;">
                <h3 style="color: #2ecc71; margin-bottom: 1rem;">📦 ${categoria.toUpperCase()}</h3>
                <p><strong>Total:</strong> ${total.toFixed(2)} kg | <strong>Registros:</strong> ${registros.length}</p>
                
                <table class="tabla-datos reporte-tabla" style="margin-top: 1rem;">
                    <thead>
                        <tr>
                            <th>Mercado</th>
                            <th>Tipo</th>
                            <th>Cantidad (kg)</th>
                            <th>Fecha</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        registros.forEach(r => {
            html += `
                <tr>
                    <td>${r.mercado}</td>
                    <td>${r.tipo}</td>
                    <td>${parseFloat(r.cantidad).toFixed(2)} kg</td>
                    <td>${r.fecha}</td>
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
    });
    
    document.getElementById('contenidoReporte').innerHTML = html;
}

function generarReporteMercado() {
    const mercadoResumen = {};
    
    registrosResiduos.forEach(r => {
        if (!mercadoResumen[r.mercado]) {
            mercadoResumen[r.mercado] = {
                residuos: [],
                tipo: r.tipoMercado,
                total: 0
            };
        }
        mercadoResumen[r.mercado].residuos.push(r);
        mercadoResumen[r.mercado].total += parseFloat(r.cantidad);
    });
    
    let html = '<h2>Reporte por Mercado/Negocio</h2>';
    
    Object.entries(mercadoResumen)
        .sort((a, b) => b[1].total - a[1].total)
        .forEach(([mercado, datos]) => {
            const tipo = datos.tipo === 'estatal' ? '🏛️ Estatal' : '🏢 Privado';
            
            html += `
                <div style="background: #f5f7fa; padding: 1.5rem; border-radius: 8px; margin: 1.5rem 0; border-left: 4px solid #3498db;">
                    <h3 style="color: #3498db; margin-bottom: 1rem;">${mercado} ${tipo}</h3>
                    <p><strong>Total Generado:</strong> ${datos.total.toFixed(2)} kg | <strong>Registros:</strong> ${datos.residuos.length}</p>
                    
                    <table class="tabla-datos reporte-tabla" style="margin-top: 1rem;">
                        <thead>
                            <tr>
                                <th>Categoría</th>
                                <th>Tipo</th>
                                <th>Cantidad (kg)</th>
                                <th>Fecha</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            datos.residuos.forEach(r => {
                html += `
                    <tr>
                        <td>${r.categoria}</td>
                        <td>${r.tipo}</td>
                        <td>${parseFloat(r.cantidad).toFixed(2)} kg</td>
                        <td>${r.fecha}</td>
                    </tr>
                `;
            });
            
            html += `
                        </tbody>
                    </table>
                </div>
            `;
        });
    
    document.getElementById('contenidoReporte').innerHTML = html;
}

function descargarExcel() {
    if (registrosResiduos.length === 0) {
        alert('No hay registros para descargar');
        return;
    }
    
    // Crear contenido CSV
    let csv = 'ID,Mercado,Tipo Mercado,Categoría,Tipo,Cantidad (kg),Fecha,Descripción\n';
    
    registrosResiduos.forEach((r, i) => {
        csv += `${i + 1},"${r.mercado}","${r.tipoMercado}","${r.categoria}","${r.tipo}",${r.cantidad},"${r.fecha}","${r.descripcion || ''}"\n`;
    });
    
    // Crear blob y descargar
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Reporte_Residuos_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
}

// ==========================================
// INICIALIZACIÓN
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    // Mostrar dashboard por defecto
    showSection('dashboard');
    
    // Cargar datos del localStorage
    mostrarEmpresas();
    mostrarHistorial();
});
