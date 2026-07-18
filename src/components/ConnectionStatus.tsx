import type { ConnectionStatusValue } from '../types';

const LABEL: Record<ConnectionStatusValue, string> = {
  connecting: 'Connecting…',
  open: 'Live',
  closed: 'Reconnecting…',
};

interface Props {
  status: ConnectionStatusValue;
}

export default function ConnectionStatus({ status }: Props) {
  return (
    <div className={`status status-${status}`}>
      <span className="status-dot" />
      {LABEL[status]}
    </div>
  );
}
