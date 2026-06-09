export type RucResult = {
  ruc: string
  digitoVerificador: number
  valido: boolean
  mensaje: string
}

export function validarRuc(numero: string): RucResult {
  let base: string
  let dvIngresado: number

  if (numero.includes('-')) {
    const partes = numero.split('-')
    base = partes[0]
    dvIngresado = parseInt(partes[1])
  } else {
    base = numero.slice(0, -1)
    dvIngresado = parseInt(numero.slice(-1))
  }

  if (!/^\d{1,8}$/.test(base)) {
    return {
      ruc: base,
      digitoVerificador: dvIngresado,
      valido: false,
      mensaje: 'El numero base del RUC debe tener entre 1 y 8 digitos',
    }
  }

  const dvCalculado = calcularDV(base)
  const valido = dvCalculado === dvIngresado

  return {
    ruc: base,
    digitoVerificador: dvCalculado,
    valido,
    mensaje: valido
      ? 'RUC valido'
      : `Digito verificador incorrecto. El correcto es ${dvCalculado}`,
  }
}

function calcularDV(base: string): number {
  let suma = 0
  let factor = 2

  for (let i = base.length - 1; i >= 0; i--) {
    suma += parseInt(base[i]) * factor
    factor++
    if (factor > 10) factor = 2
  }

  const resto = suma % 11
  const dv = 11 - resto

  if (dv === 11) return 0
  if (dv === 10) return 1
  return dv
}
