const formatToRef = label => {
  let rlabel = '';
  let nletter = true;
  for (let i = 0; i < label.length; i++) {
    if ((label.charCodeAt(i) > 64 && label.charCodeAt(i) < 91) ||
      (label.charCodeAt(i) > 96 && label.charCodeAt(i) < 123)) {
      rlabel += nletter ? label[i].toUpperCase() : label[i];
      nletter = false;
      continue;
    }
    nletter = true;
  }
  return rlabel;
};

const retrieveContentType = (type, metas) => {
  switch (type)
  {
    case 'array':
    case 'object':
      return 'application/json';
    break;
    default:
      const meta = metas.find(meta => meta['Content-Type']);
      return (meta && meta['Content-Type']) || 'text/plain';
  }
};

module.exports = ({
  formatToRef,
  retrieveContentType
});
