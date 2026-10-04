/* Team access and role management backed by the Supabase equipe table. */
const teamMemberIsActive = member => member.ativo !== false;
const promoBtn = user => {
  const member = TEAM().find(person => person.email.toLowerCase() === String(user.email).toLowerCase());
  return member
    ? bd(teamMemberIsActive(member) ? (member.papel === 'admin' ? 'adm' : 'col') : 'sold',
      teamMemberIsActive(member) ? PAPEL[member.papel] : 'Inativo')
    : '<span class="mut">Cadastre pela aba Equipe</span>';
};

function pgTeam() {
  const rows = TEAM().map(member => {
    const active = teamMemberIsActive(member);
    return '<tr><td><b>' + esc(member.nome || '—') + '</b><small>' + esc(member.email) + '</small></td>'
      + '<td>Google</td><td><select data-trole="' + esc(member.email) + '" aria-label="Papel" style="width:auto">'
      + opt(Object.entries(PAPEL), member.papel) + '</select></td><td>'
      + (member.ultimo ? dtt(member.ultimo) : 'Nunca entrou') + '</td><td>'
      + bd(active ? 'ok' : 'sold', active ? 'Ativo' : 'Inativo') + '</td><td>'
      + '<button class="btn sm' + (active ? ' danger' : '') + '" data-a="tstatus" data-id="' + esc(member.email) + '">'
      + (active ? 'Inativar' : 'Ativar') + '</button></td></tr>';
  }).join('');

  return '<div class="card"><h3>Adicionar pessoa</h3>'
    + '<p class="mut" style="margin:0 0 18px">A pessoa poderá entrar com Google após ser adicionada à equipe e com o provedor Google configurado no Supabase.</p>'
    + '<div class="g3"><label>Nome<input id="t_nome"></label><label>E-mail *<input id="t_email" type="email"></label>'
    + '<label>Papel<select id="t_papel">' + opt([['colab', 'Colaborador'], ['admin', 'Administrador']], 'colab')
    + '</select></label></div><div class="acts"><button class="btn primary" data-a="tadd">Adicionar pessoa</button></div></div>'
    + '<div class="card tw"><table><thead><tr><th>Pessoa</th><th>Acesso por</th><th>Papel</th><th>Último acesso</th><th>Situação</th><th>Ações</th></tr></thead>'
    + '<tbody>' + rows + '</tbody></table></div>'
    + '<div class="card"><h3>O que cada papel pode fazer</h3><div class="g2">'
    + '<div><b>Administrador</b><p class="mut" style="margin:6px 0 0">Acesso total, incluindo configurações e equipe.</p></div>'
    + '<div><b>Colaborador</b><p class="mut" style="margin:6px 0 0">Atendimento, imóveis e negócios conforme as políticas do banco.</p></div>'
    + '</div></div>';
}
