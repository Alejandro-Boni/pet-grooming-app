import { useNavigate } from 'react-router-dom';
import { playRoyalPageTransition } from '../utils/pageTransition';

export default function PageTransitionLink({ to, children, className }) {
  const navigate = useNavigate();

  function handleClick(event) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();
    playRoyalPageTransition(() => navigate(to));
  }

  return (
    <a href={to} onClick={handleClick} className={className}>
      {children}
    </a>
  );
}
