const SB_URL = 'https://mcdiohrcotqrldydpswg.supabase.co';
const SB_KEY = 'sb_publishable_jkGjJ5973O6jiiN9XRKs4g_iK9R1s8m'; 
const _supabase = supabase.createClient(SB_URL, SB_KEY);

async function init() {
    const { data: { session } } = await _supabase.auth.getSession();
    const isAdmin = !!session;

    if (isAdmin) {
        document.getElementById('login-btn').style.display = 'none';
        document.getElementById('logout-btn').style.display = 'inline-block';
        document.getElementById('user-email').innerText = session.user.email + " | ";
    }

    fetchMembers(isAdmin);
}

async function fetchMembers(isAdmin) {
    const { data, error } = await _supabase
        .from('boss_hits')
        .select('*')
        .order('member_name', { ascending: true });

    if (error) {
        console.error(error);
        document.getElementById('member-list').innerHTML = `<tr><td colspan="4">Error: ${error.message}</td></tr>`;
        return;
    }

    const list = document.getElementById('member-list');
    list.innerHTML = '';

    if (data.length === 0) {
        list.innerHTML = '<tr><td colspan="4">No members found. Add some in the Supabase SQL Editor!</td></tr>';
    }

    data.forEach(member => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${member.member_name}</td>
            <td><input type="checkbox" ${member.hit_1 ? 'checked' : ''} ${!isAdmin ? 'disabled' : ''} onchange="updateHit(${member.id}, 'hit_1', this.checked)"></td>
            <td><input type="checkbox" ${member.hit_2 ? 'checked' : ''} ${!isAdmin ? 'disabled' : ''} onchange="updateHit(${member.id}, 'hit_2', this.checked)"></td>
            <td><input type="checkbox" ${member.hit_3 ? 'checked' : ''} ${!isAdmin ? 'disabled' : ''} onchange="updateHit(${member.id}, 'hit_3', this.checked)"></td>
        `;
        list.appendChild(row);
    });
}

async function updateHit(id, column, value) {
    const obj = {};
    obj[column] = value;
    const { error } = await _supabase.from('boss_hits').update(obj).eq('id', id);
    if (error) alert("Update failed: " + error.message);
}

async function logout() {
    await _supabase.auth.signOut();
    window.location.reload();
}

init();
