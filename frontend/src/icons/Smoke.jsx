// Composant minimal utilisé par tests/jsxruntime.test.js pour vérifier le runtime JSX de bout en bout.
export const Smoke = ({ n = 3 }) => (<div title=":i-gear: Réglages"><b>:i-rocket: Décoller</b> <i>{`T-${n} :i-timer:`}</i></div>);
