const SB_URL = 'https://mcdiohrcotqrldydpswg.supabase.co';
const SB_KEY = 'sb_publishable_jkGjJ5973O6jiiN9XRKs4g_iK9R1s8m';
const DISCORD_WEBHOOK = 'https://discord.com/api/webhooks/1491631332936253530/wHXUuVlzPQF40J7XYocfwp58LMdVFA4g4RqPJk4Kcr2S_OiaksvTOWVaoevB4fNjewC0';

let _supabase;

async function init() {
    const list = document.getElementById('member-list');
    
    try {
        // 1. Check if the Supabase library exists
        if (typeof supabase === 'undefined') {
            list.innerHTML = `<tr><td colspan="5" style="color:orange;">Loading Library... (If this stays, check your internet)</td></tr>`;
            setTimeout(init, 1000); // Try again in 1 second
            return;
        }

        // 2. Initialize the client
        _supabase = supabase.createClient(SB_URL, SB_KEY);

        // 3. Check for Admin Login
        const { data: { session }, error: authError } = await _supabase.auth.getSession();
        const isAdmin = !!session;

        if (isAdmin) {
            document.getElementById('login-btn').style.display = 'none';
            document.getElementById('logout-btn').style.display = 'inline-block';
            document.getElementById('admin-tools').style.display = 'flex';
            document.getElementById('user-email').innerText = session.user.email + " | ";
            document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'table-cell');
        }

        // 4. Fetch the data
        fetchMembers(isAdmin);

    } catch (err) {
        list.innerHTML = `<tr><td colspan="5" style="color:red;">Critical Error: ${err.message}</td></tr>`;
    }
}

async function fetchMembers(isAdmin) {
    const list = document.getElementById('member-list');
    const { data, error } = await _supabase
        .from('boss_hits')
        .select('*')
        .order('member_name', { ascending: true });

    if (error) {
        list.innerHTML = `<tr><td colspan="5">Database Error: ${error.message}</td></tr>`;
        return;
    }

    if (!data || data.length === 0) {
        list.innerHTML = `<tr><td colspan="5">No members found. Add some in Admin mode!</td></tr>`;
        return;
    }

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

    let maxNameLength = 0;
    data.forEach(m => { if (m.member_name.length > maxNameLength) maxNameLength = m.member_name.length; });
    const colWidth = maxNameLength + 2;

    let desc = "```\n";
    desc += "NAME".padEnd(colWidth) + " H1  H2  H3\n";
    desc += "-".repeat(colWidth + 12) + "\n";

    data.forEach(m => {
        const h1 = m.hit_1 ? "X " : "OK";
        const h2 = m.hit_2 ? "X " : "OK";
        const h3 = m.hit_3 ? "X " : "OK";
        desc += `${m.member_name.padEnd(colWidth)} [${h1}] [${h2}] [${h3}]\n`;
    });
    desc += "
http://googleusercontent.com/immersive_entry_chip/0

### Still having issues?
If you update this and it **still** says connecting:
1.  **Check your `index.html`**: Make sure this line is inside your `<head>` tag:
    `<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>`
2.  **Hard Refresh**: On your browser, press `Ctrl + F5` (Windows) or `Cmd + Shift + R` (Mac). GitHub sometimes takes a minute to "clear the cache" of the old file.
3.  **Check the Console**: If it stays stuck, press **F12** and look at the **Console** tab. If there is a red error there, copy and paste it here!

**Does the screen change or show a specific error code now?**
