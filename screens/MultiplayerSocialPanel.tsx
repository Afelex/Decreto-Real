import React from 'react';
import { portraitUrl } from '../game/duelistProfile';

export type SocialPeer = { id: string; name: string; portrait: string;
  status: 'available' | 'busy'; friend: boolean };
export type FriendRequest = { from: string; name: string };
export type SocialMessage = { from: string; to: string; name: string; message: string; at: number };
export type SocialStatus = 'hidden' | 'available' | 'busy';

type Props = {
  peers: SocialPeer[]; total: number; requests: FriendRequest[]; friends: string[];
  messages: SocialMessage[]; status: SocialStatus; myId: string; online: boolean;
  onStatus: (status: SocialStatus) => void; onSend: (data: object) => boolean;
  onClose: () => void;
};

export function MultiplayerSocialPanel({ peers, total, requests, friends, messages,
  status, myId, online, onStatus, onSend, onClose }: Props) {
  const [tab, setTab] = React.useState<'all' | 'friends' | 'requests'>('all');
  const [chatId, setChatId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState('');
  const [sentRequests, setSentRequests] = React.useState<string[]>([]);
  const scroller = React.useRef<HTMLDivElement | null>(null);
  const chatPeer = peers.find(peer => peer.id === chatId);
  const chatMessages = messages.filter(item =>
    (item.from === myId && item.to === chatId) || (item.from === chatId && item.to === myId));
  const visible = tab === 'friends' ? peers.filter(peer => friends.includes(peer.id)) : peers;

  React.useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight;
  }, [chatId, messages.length]);

  const submitMessage = (event: React.FormEvent) => {
    event.preventDefault();
    const message = draft.trim();
    if (chatPeer && message && onSend({ type: 'social:chat', to: chatPeer.id, message }))
      setDraft('');
  };

  const requestFriend = (peer: SocialPeer) => {
    if (onSend({ type: 'social:friend_request', to: peer.id }))
      setSentRequests(current => [...current, peer.id]);
  };

  return <div className="dr-pvp-social-cover" role="dialog" aria-modal="true" aria-label="Amigos y chat">
    <section className="dr-pvp-social-panel">
      <header className="dr-pvp-social-header">
        <div><small>DECRETO REAL · MULTIJUGADOR</small>
          <h2>{chatId ? 'Conversación' : 'Amigos y chat'}</h2></div>
        <button type="button" onClick={chatId ? () => setChatId(null) : onClose}
          aria-label={chatId ? 'Volver a amigos' : 'Cerrar amigos y chat'}>
          {chatId ? '‹' : '×'}
        </button>
      </header>
      {chatId ? <>
        <div className="dr-pvp-chat-person">
          <strong>{chatPeer?.name || 'Duelista desconectado'}</strong>
          <small>{chatPeer ? (chatPeer.status === 'available' ? '● Disponible' : '● Ocupado') : 'Sin conexión'}</small>
        </div>
        <div className="dr-pvp-chat-messages" ref={scroller} aria-live="polite" aria-label="Mensajes">
          {!chatMessages.length && <p className="dr-pvp-social-empty">
            Envía un saludo a tu amigo. Los mensajes de esta versión son temporales.</p>}
          {chatMessages.map((item, i) => <div key={String(item.at) + i}
            className={'dr-pvp-chat-bubble ' + (item.from === myId ? 'mine' : 'theirs')}>
            <span>{item.message}</span>
            <small>{new Date(item.at).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}</small>
          </div>)}
        </div>
        <form className="dr-pvp-chat-compose" onSubmit={submitMessage}>
          <input aria-label="Escribe un mensaje" value={draft} maxLength={500}
            onChange={event => setDraft(event.target.value)} disabled={!online || !chatPeer}
            placeholder={chatPeer ? 'Escribe un mensaje…' : 'Amigo sin conexión'} />
          <button type="submit" disabled={!draft.trim() || !chatPeer || !online}>Enviar</button>
        </form>
        <p className="dr-pvp-social-note">Chat privado entre amigos conectados. No compartas datos sensibles.</p>
      </> : <>
        <div className="dr-pvp-social-visibility">
          <span>Mi estado</span>
          <div role="group" aria-label="Estado de conexión">
            <button type="button" aria-pressed={status === 'available'}
              className={status === 'available' ? 'is-selected' : ''}
              onClick={() => onStatus('available')}><i className="is-available"/>Disponible</button>
            <button type="button" aria-pressed={status === 'busy'}
              className={status === 'busy' ? 'is-selected' : ''}
              onClick={() => onStatus('busy')}><i className="is-busy"/>Ocupado</button>
            <button type="button" aria-pressed={status === 'hidden'}
              className={status === 'hidden' ? 'is-selected' : ''}
              onClick={() => onStatus('hidden')}><i className="is-hidden"/>Oculto</button>
          </div>
        </div>
        <div className="dr-pvp-social-tabs" role="tablist" aria-label="Jugadores y amigos">
          <button type="button" role="tab" aria-selected={tab === 'all'} onClick={() => setTab('all')}>
            Jugadores ({total})</button>
          <button type="button" role="tab" aria-selected={tab === 'friends'} onClick={() => setTab('friends')}>
            Mis amigos ({friends.length})</button>
          <button type="button" role="tab" aria-selected={tab === 'requests'} onClick={() => setTab('requests')}>
            Solicitudes ({requests.length})</button>
        </div>
        <div className="dr-pvp-social-list" role="tabpanel">
          {tab === 'requests' ? (
            requests.length ? requests.map(request => <article className="dr-pvp-social-peer" key={request.from}>
              <div className="dr-pvp-social-peer-copy"><strong>{request.name}</strong>
                <small>Quiere ser tu amigo</small></div>
              <div className="dr-pvp-social-actions">
                <button type="button" onClick={() => onSend({ type: 'social:friend_reply', from: request.from, accept: true })}>Aceptar</button>
                <button type="button" onClick={() => onSend({ type: 'social:friend_reply', from: request.from, accept: false })}>Rechazar</button>
              </div>
            </article>) : <p className="dr-pvp-social-empty">No tienes solicitudes pendientes.</p>
          ) : visible.length ? visible.map(peer => <article className="dr-pvp-social-peer" key={peer.id}>
            <img src={portraitUrl(peer.portrait)} alt="" />
            <div className="dr-pvp-social-peer-copy">
              <strong>{peer.name}</strong>
              <small><i className={peer.status === 'available' ? 'is-available' : 'is-busy'}/>
                {peer.status === 'available' ? 'Disponible' : 'Ocupado'}
                {friends.includes(peer.id) ? ' · Amigo' : ''}</small>
            </div>
            <div className="dr-pvp-social-actions">
              {friends.includes(peer.id) ?
                <button type="button" onClick={() => setChatId(peer.id)} aria-label={'Chatear con ' + peer.name}>Chat</button> :
                <button type="button" disabled={sentRequests.includes(peer.id)}
                  onClick={() => requestFriend(peer)}>{sentRequests.includes(peer.id) ? 'Enviada' : 'Agregar'}</button>}
              <button type="button" className="challenge" onClick={() => onSend({ type: 'social:challenge', to: peer.id })}
                aria-label={'Desafiar a ' + peer.name}>Desafiar</button>
              <details><summary aria-label={'Más opciones para ' + peer.name}>⋮</summary>
                <div className="dr-pvp-social-more">
                  <button type="button" onClick={() => {
                    if (window.confirm('¿Bloquear a este duelista?')) onSend({ type: 'social:block', to: peer.id });
                  }}>Bloquear</button>
                  <button type="button" onClick={() => {
                    if (window.confirm('¿Reportar a este duelista por conducta inadecuada?'))
                      onSend({ type: 'social:report', to: peer.id, reason: 'otro' });
                  }}>Reportar</button>
                </div>
              </details>
            </div>
          </article>) : <p className="dr-pvp-social-empty">{tab === 'friends'
            ? 'Tus amigos conectados aparecerán aquí. Agrega duelistas en la pestaña Jugadores.'
            : 'Nadie se está mostrando como disponible u ocupado. Puedes activar tu estado para que te encuentren.'}</p>}
        </div>
        <p className="dr-pvp-social-note">Verde: disponible · Ámbar: ocupado · Oculto: no apareces en la lista.
          Esta sala social usa perfiles temporales del dispositivo; la sincronización con La Plaza aún no está activa.</p>
      </>}
    </section>
  </div>;
}
