const SB_URL = 'https://mcdiohrcotqrldydpswg.supabase.co';
const SB_KEY = 'sb_publishable_jkGjJ5973O6jiiN9XRKs4g_iK9R1s8m';
const DISCORD_WEBHOOK = 'https://discord.com/api/webhooks/1491631332936253530/wHXUuVlzPQF40J7XYocfwp58LMdVFA4g4RqPJk4Kcr2S_OiaksvTOWVaoevB4fNjewC0';

let _supabase;

async function init() {
    try {
        _supabase = supabase.createClient(SB_URL, SB_KEY);
    } catch (e) {
        document.getElementById('member-list').innerHTML = `<tr><td colspan="5">Library Error: Refresh.</td></tr>`;
        return;
    }

    const { data: { session } } = await _supabase.auth.getSession();
    const isAdmin = !!session;

    if (isAdmin) {
        document.getElementById('login-btn').style.display = 'none';
        document.getElementById('logout-btn').style.display = 'inline-block';
        document.getElementById('admin-tools').style.display = 'flex';
        document.getElementById('user-email').innerText = session.user.email + " | ";
        document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'table-cell');
    }

    fetchMembers(isAdmin);
}

async function fetchMembers(isAdmin) {
    const { data, error } = await _supabase
        .from('boss_hits')
        .select('*')
        .order('member_name', { ascending: true });

    const list = document.getElementById('member-list');
    if (error) { list.innerHTML = `<tr><td colspan="5">Error: ${error.message}</td></tr>`; return; }
    if (!data || data.length === 0) { list.innerHTML = `<tr><td colspan="5">No members found.</td></tr>`; return; }

    list.innerHTML = '';
    data.forEach(m => {
        const row = document.createElement('tr');
        const nameCell = isAdmin 
            ? `<input type="text" class="edit-name-input" value="${m.member_name}" onchange="updateMemberName(${m.id}, this.value)">`
            : `<span>${m.member_name}</span>`;

        row.innerHTML = `
            <td>${nameCell}</td>
            <td><input type="checkbox" ${m.hit_1 ? 'checked' : ''} ${!isAdmin ? 'disabled' : ''} onchange="updateHit(${m.id}, 'hit_1', this.checked)"></td>
            <td><input type="checkbox" ${m.hit_2 ? 'checked' : ''} ${!isAdmin ? 'disabled' : ''} onchange="updateHit(${m.id}, 'hit_2', this.checked)"></td>
            <td><input type="checkbox" ${m.hit_3 ? 'checked' : ''} ${!isAdmin ? 'disabled' : ''} onchange="updateHit(${m.id}, 'hit_3', this.checked)"></td>
            ${isAdmin ? `<td class="admin-only"><button class="btn danger" onclick="delMember(${m.id})">Remove</button></td>` : ''}
        `;
        list.appendChild(row);
    });
}

async function updateHit(id, col, val) {
    const upd = {}; upd[col] = val;
    await _supabase.from('boss_hits').update(upd).eq('id', id);
}

async function updateMemberName(id, newName) {
    if (!newName.trim()) return;
    await _supabase.from('boss_hits').update({ member_name: newName }).eq('id', id);
}

async function addMember() {
    const nameInput = document.getElementById('new-member-name');
    const name = nameInput.value.trim();
    if (!name) return;
    const { error } = await _supabase.from('boss_hits').insert([{ member_name: name }]);
    if (error) alert(error.message); else location.reload();
}

async function clearAllHits() {
    if (confirm("Reset all hits?")) {
        await _supabase.from('boss_hits').update({ hit_1: false, hit_2: false, hit_3: false }).neq('id', 0);
        location.reload();
    }
}

async function sendToDiscord() {
    const { data, error: dbError } = await _supabase.from('boss_hits').select('*').order('member_name');
    if (dbError) return alert("Database error: " + dbError.message);

    // Find the longest name to set the padding
    let maxNameLength = 0;
    data.forEach(m => { if (m.member_name.length > maxNameLength) maxNameLength = m.member_name.length; });
    
    // Add a little extra buffer
    const columnWidth = maxNameLength + 2;

    let description = "```\n";
    description += "NAME".padEnd(columnWidth) + " H1  H2  H3\n";
    description += "-".repeat(columnWidth + 12) + "\n";

    data.forEach(m => {
        const h1 = m.hit_1 ? "X " : "OK";
        const h2 = m.hit_2 ? "X " : "OK";
        const h3 = m.hit_3 ? "X " : "OK";
        
        // Pad the name so the hits start at the same spot
        const paddedName = m.member_name.padEnd(columnWidth);
        description += `${paddedName} [${h1}] [${h2}] [${h3}]\n`;
    });
    description += "
http://googleusercontent.com/immersive_entry_chip/0

### What's different?
* **The Look:** I switched from Emojis (✅/❌) to text markers (**OK** and **X**) inside the code block. Discord emojis in code blocks don't always align perfectly on mobile, whereas text characters are 100% stable.
* **The Spacing:** I used `.padEnd()`, which looks at the longest name in your list and adds spaces to every other name so they all match that length.
* **The Legend:** I added a footer so people know "OK" means they are safe/need to hit, and "X" means they've completed their task.

**Push this to GitHub, wait a minute, and try a test post. It should look like a clean, professional spreadsheet in your Discord channel now!**
