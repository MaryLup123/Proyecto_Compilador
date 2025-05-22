function analizar() {
  const codigo = document.getElementById("codigo").value;
  const lineas = codigo.split('\n');

  let resultadoLexico = "";
  let resultadoSintactico = "";
  let arbolCompleto = "";
  let errores = "";

  const tabla = document.getElementById("tablaTokens").querySelector("tbody");
  tabla.innerHTML = "";

  let ultimoArbol = null;

  for (let i = 0; i < lineas.length; i++) {
    const linea = lineas[i].trim();
    if (linea === "") continue;

    const tokens = linea.match(/[a-zA-Z_]\w*|\d+|[+\-*/=;()]/g) || [];
    resultadoLexico += `Línea ${i + 1}:\n`;
    for (const token of tokens) {
      let tipo = "";

      if (/^(int|float|if|else|while|for|return)$/.test(token)) {
        tipo = "Palabra reservada";
      } else if (/^\d+$/.test(token)) {
        tipo = "Número";
      } else if (/^[a-zA-Z_]\w*$/.test(token)) {
        tipo = "Identificador";
      } else if (/^[+\-*/=;()]$/.test(token)) {
        tipo = "Símbolo";
      } else {
        tipo = "Desconocido";
        errores += `Línea ${i + 1}: Token no reconocido: '${token}'\n`;
      }

      resultadoLexico += `  ${tipo}: ${token}\n`;

      const row = tabla.insertRow();
      row.insertCell(0).textContent = i + 1;
      row.insertCell(1).textContent = tipo;
      row.insertCell(2).textContent = token;
    }

    const sint = analizarSintactico(linea, i + 1);
    resultadoSintactico += `Línea ${i + 1}: ${sint.mensaje}\n`;
    if (sint.error) errores += `Línea ${i + 1}: ${sint.error}\n`;
    if (sint.arbol) arbolCompleto += `Línea ${i + 1}:\n${sint.arbol}\n`;
    if (sint.estructura) ultimoArbol = sint.estructura;
  }

  document.getElementById("lexico").textContent = resultadoLexico;
  document.getElementById("sintactico").textContent = resultadoSintactico;
  document.getElementById("arbol").textContent = arbolCompleto || "(no válido)";
  document.getElementById("consolaErrores").textContent = errores || "Sin errores.";

  if (ultimoArbol) {
    dibujarArbolSintactico(ultimoArbol);
  } else {
    document.getElementById("arbolGrafico").innerHTML = `
graph TD
  A[<grammar prog>] --> B[prog]
  B --> C[declaración]
  B --> D[expresión]
`;
mermaid.init(undefined, "#arbolGrafico");

  }
}

function analizarSintactico(linea, numLinea) {
  if (!linea.endsWith(";")) {
    return { mensaje: "Error: falta ';'", error: "Falta punto y coma al final", arbol: "" };
  }

  const sinPuntoComa = linea.slice(0, -1).trim();
  const declaracion = /^int\s+[a-zA-Z_]\w*\s*=\s*[\w+\-*/\s]+$/;
  const asignacion = /^[a-zA-Z_]\w*\s*=\s*[\w+\-*/\s]+$/;

  if (declaracion.test(sinPuntoComa)) {
    const [tipo, resto] = sinPuntoComa.split(/\s+/, 2);
    const [id, expr] = resto.split('=').map(e => e.trim());
    return {
      mensaje: "Declaración válida.",
      arbol: `  Declaración\n  ├── Tipo: ${tipo}\n  ├── Identificador: ${id}\n  └── Expresión: ${expr}`,
      estructura: {
        name: "Declaración",
        children: [
          { name: "Tipo", children: [{ name: tipo }] },
          { name: "Identificador", children: [{ name: id }] },
          { name: "Expresión", children: [{ name: expr }] }
        ]
      }
    };
  } else if (asignacion.test(sinPuntoComa)) {
    const [id, expr] = sinPuntoComa.split('=').map(e => e.trim());
    return {
      mensaje: "Asignación válida.",
      arbol: `  Asignación\n  ├── Identificador: ${id}\n  └── Expresión: ${expr}`,
      estructura: {
        name: "Asignación",
        children: [
          { name: "Identificador", children: [{ name: id }] },
          { name: "Expresión", children: [{ name: expr }] }
        ]
      }
    };
  } else {
    return { mensaje: "Error de sintaxis.", error: "Estructura no reconocida", arbol: "" };
  }
}

function dibujarArbolSintactico(data) {
  const container = document.getElementById("arbolVisual");
  container.innerHTML = "";

  const width = container.offsetWidth;
  const height = container.offsetHeight;

  const svg = d3.select("#arbolVisual")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const root = d3.hierarchy(data);
  const treeLayout = d3.tree().size([width - 40, height - 40]);
  treeLayout(root);

  svg.selectAll('line')
    .data(root.links())
    .enter()
    .append('line')
    .attr('x1', d => d.source.x + 20)
    .attr('y1', d => d.source.y + 20)
    .attr('x2', d => d.target.x + 20)
    .attr('y2', d => d.target.y + 20)
    .attr('stroke', '#999');

  svg.selectAll('circle')
    .data(root.descendants())
    .enter()
    .append('circle')
    .attr('cx', d => d.x + 20)
    .attr('cy', d => d.y + 20)
    .attr('r', 15)
    .attr('fill', '#89CFF0');

  svg.selectAll('text')
    .data(root.descendants())
    .enter()
    .append('text')
    .attr('x', d => d.x + 20)
    .attr('y', d => d.y + 20)
    .attr('dy', 4)
    .attr('text-anchor', 'middle')
    .text(d => d.data.name)
    .style('font-size', '12px');
}
