import { createRoot } from 'react-dom/client';
import Routing from './Routing';

const container = document.getElementById('root')!;
const root = createRoot(container);
root.render(<Routing />);
