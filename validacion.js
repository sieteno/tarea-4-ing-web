'use strict';

const form = document.querySelector('#inscripcion');
const confirmacion = document.querySelector('#confirmacion');
const tocados = new Set();
const campoSede = document.querySelector('#campo-sede');
const sede = form.elements.namedItem('sede');
const clave = form.elements.namedItem('clave');
const contador = document.querySelector('#comentarios-contador');
const fuerza = document.querySelector('#fuerza');
const fuerzaTexto = document.querySelector('#fuerza-texto');

// Fecha local: evita que la zona horaria cambie el día de nacimiento.
function fechaLocal(fecha) {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
}
form.elements.namedItem('nacimiento').max = fechaLocal(new Date());
function validarEdad(valor) {
  if (!valor) return 'Indica tu fecha de nacimiento.';
  const [anio, mes, dia] = valor.split('-').map(Number);
  const fecha = new Date(0);
  fecha.setFullYear(anio, mes - 1, dia);
  fecha.setHours(0, 0, 0, 0);
  if (!Number.isFinite(fecha.getTime()) || fecha.getFullYear() !== anio || fecha.getMonth() !== mes - 1 || fecha.getDate() !== dia) return 'Indica una fecha válida.';
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  if (fecha > hoy) return 'La fecha no puede ser futura.';
  let edad = hoy.getFullYear() - anio;
  if (hoy.getMonth() < mes - 1 || (hoy.getMonth() === mes - 1 && hoy.getDate() < dia)) edad--;
  return edad >= 16 || 'Debes tener al menos 16 años cumplidos.';
}

// Cada regla devuelve true o un mensaje explicativo.
const reglas = {
  nombre: valor => {
    const nombre = valor.trim();
    if (nombre.length < 5 || nombre.length > 60) return 'El nombre debe tener entre 5 y 60 caracteres.';
    return /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?: +[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)+$/.test(nombre) || 'Escribe nombre y apellido, solo con letras.';
  },
  cedula: valor => /^([1-9]|1[0-3]|PE|E|N)-\d{1,4}-\d{1,6}$/i.test(valor.trim()) || 'Usa el formato 8-123-4567 (provincia 1–13, PE, E o N).',
  correo: valor => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor.trim()) || 'Usa un correo como nombre@dominio.com.',
  celular: valor => /^6\d{3}-?\d{4}$/.test(valor.trim()) || 'El celular debe tener 8 dígitos y empezar con 6.',
  nacimiento: validarEdad,
  curso: valor => ['web', 'javascript', 'datos', 'redes'].includes(valor) || 'Elige un curso.',
  modalidad: valor => ['presencial', 'virtual'].includes(valor) || 'Elige una modalidad.',
  sede: valor => ['panama', 'david', 'santiago'].includes(valor) || 'Elige una sede.',
  clave: valor => {
    const faltan = [];
    if (valor.length < 8) faltan.push('8 caracteres');
    if (!/[A-ZÁÉÍÓÚÜÑ]/.test(valor)) faltan.push('una mayúscula');
    if (!/[a-záéíóúüñ]/.test(valor)) faltan.push('una minúscula');
    if (!/\d/.test(valor)) faltan.push('un número');
    if (!/[^\p{L}\p{N}\s]/u.test(valor)) faltan.push('un símbolo');
    return faltan.length === 0 || `Te falta: ${faltan.join(', ')}.`;
  },
  clave2: valor => (valor.length > 0 && valor === clave.value) || 'Las contraseñas no coinciden.',
  comentarios: valor => valor.length <= 200 || 'Máximo 200 caracteres.',
  terminos: valor => valor || 'Debes aceptar los términos.'
};

function controles(nombre) {
  return [...form.elements].filter(elemento => elemento.name === nombre);
}

// Único punto que aplica las reglas y muestra los errores accesibles.
function validarCampo(input) {
  const nombre = input.name;
  if (!Object.hasOwn(reglas, nombre) || input.disabled) return true;
  let valor = input.value;
  if (input.type === 'checkbox') valor = input.checked;
  if (input.type === 'radio') valor = form.elements.namedItem(nombre).value;
  const resultado = reglas[nombre](valor);
  const valido = resultado === true;
  controles(nombre).forEach(control => control.setAttribute('aria-invalid', String(!valido)));
  document.getElementById(`${nombre}-error`).textContent = valido ? '' : resultado;
  return valido;
}

function actualizarSede() {
  const presencial = form.elements.namedItem('modalidad').value === 'presencial';
  campoSede.hidden = !presencial;
  sede.disabled = !presencial;
  sede.required = presencial;
  if (!presencial) {
    sede.value = '';
    sede.removeAttribute('aria-invalid');
    document.querySelector('#sede-error').textContent = '';
    tocados.delete('sede');
  }
}

function actualizarFuerza() {
  const valor = clave.value;
  const criterios = [valor.length >= 8, /[A-ZÁÉÍÓÚÜÑ]/.test(valor), /[a-záéíóúüñ]/.test(valor), /\d/.test(valor), /[^\p{L}\p{N}\s]/u.test(valor)];
  const puntos = criterios.filter(Boolean).length;
  fuerza.value = puntos;
  const niveles = ['Muy débil', 'Muy débil', 'Débil', 'Media', 'Buena', 'Fuerte'];
  fuerzaTexto.textContent = `Fuerza: ${valor ? niveles[puntos] : 'sin contraseña'}`;
}
function actualizarContador() {
  const total = form.elements.namedItem('comentarios').value.length;
  contador.textContent = `${total} / 200`;
  contador.classList.toggle('aviso', total > 180);
  contador.classList.toggle('exceso', total > 200);
}

// blur no burbujea: true permite capturarlo desde el formulario.
form.addEventListener('blur', evento => {
  if (!Object.hasOwn(reglas, evento.target.name) || evento.target.disabled) return;
  tocados.add(evento.target.name);
  validarCampo(evento.target);
}, true);
form.addEventListener('input', evento => {
  const input = evento.target;
  if (input.name === 'clave') {
    actualizarFuerza();
    if (tocados.has('clave2')) validarCampo(form.elements.namedItem('clave2'));
  }
  if (input.name === 'comentarios') actualizarContador();
  if (tocados.has(input.name)) validarCampo(input);
});
form.addEventListener('change', evento => {
  if (evento.target.name === 'modalidad') actualizarSede();
  if (tocados.has(evento.target.name)) validarCampo(evento.target);
});

function mostrarResumen(datos) {
  const tarjeta = document.createElement('article');
  tarjeta.className = 'tarjeta';
  const titulo = document.createElement('h2');
  titulo.textContent = '¡Inscripción completada!';
  const aviso = document.createElement('p');
  aviso.textContent = 'Confirmación de demostración. Los datos no se enviaron a un servidor.';
  const lista = document.createElement('dl');
  const etiquetaSeleccionada = nombre => form.elements.namedItem(nombre).selectedOptions[0].textContent;
  const filas = [
    ['Nombre', datos.get('nombre').trim()], ['Cédula', datos.get('cedula').trim().toUpperCase()],
    ['Correo', datos.get('correo').trim()], ['Celular', datos.get('celular').trim()],
    ['Nacimiento', datos.get('nacimiento').split('-').reverse().join('/')],
    ['Curso', etiquetaSeleccionada('curso')], ['Modalidad', datos.get('modalidad') === 'presencial' ? 'Presencial' : 'Virtual']
  ];
  if (datos.get('modalidad') === 'presencial') filas.push(['Sede', etiquetaSeleccionada('sede')]);
  filas.push(['Comentarios', datos.get('comentarios').trim() || 'Sin comentarios'], ['Términos', 'Aceptados']);
  // Solo se incluyen los campos anteriores: nunca se muestra la contraseña.
  filas.forEach(([etiqueta, valor]) => {
    const dt = document.createElement('dt');
    const dd = document.createElement('dd');
    dt.textContent = etiqueta;
    dd.textContent = valor;
    lista.append(dt, dd);
  });
  tarjeta.append(titulo, aviso, lista);
  confirmacion.replaceChildren(tarjeta);
  tarjeta.tabIndex = -1;
  tarjeta.focus();
}

form.addEventListener('submit', evento => {
  evento.preventDefault();
  confirmacion.replaceChildren();
  actualizarSede();
  // Un control por nombre para no validar dos veces el grupo de radios.
  const campos = Object.keys(reglas).map(nombre => controles(nombre)[0]).filter(input => !input.disabled);
  campos.forEach(input => tocados.add(input.name));
  const invalidos = campos.filter(input => !validarCampo(input));
  if (invalidos.length) { invalidos[0].focus(); return; }
  mostrarResumen(new FormData(form));
  form.reset();
});
form.addEventListener('reset', () => {
  tocados.clear();
  form.querySelectorAll('[aria-invalid]').forEach(input => input.removeAttribute('aria-invalid'));
  form.querySelectorAll('.error').forEach(error => { error.textContent = ''; });
  // reset se dispara antes de que el navegador restablezca los valores.
  queueMicrotask(() => { actualizarSede(); actualizarFuerza(); actualizarContador(); });
});
form.querySelector('[type="reset"]').addEventListener('click', () => confirmacion.replaceChildren());
actualizarSede();
actualizarContador();
actualizarFuerza();
