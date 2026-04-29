export function getImageDisplayRect(canvas: HTMLCanvasElement) {
  const el = canvas.getBoundingClientRect();
  const imgAspect = canvas.width / canvas.height;
  const elAspect = el.width / el.height;
  let imgW: number, imgH: number;
  if (imgAspect > elAspect) {
    imgW = el.width;
    imgH = el.width / imgAspect;
  } else {
    imgH = el.height;
    imgW = el.height * imgAspect;
  }
  return {
    left: el.left + (el.width - imgW) / 2,
    top: el.top + (el.height - imgH) / 2,
    width: imgW,
    height: imgH,
  };
}
