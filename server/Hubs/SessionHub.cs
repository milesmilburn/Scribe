using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

public class SessionHub : Hub
{
    private readonly ScribeDbContext _db;
    private readonly PresenceTracker _presence;

    public SessionHub(ScribeDbContext db, PresenceTracker presence)
    {
        _db = db;
        _presence = presence;
    }

    public async Task JoinSession(string code, string displayName)
    {
        var name = displayName?.Trim();
        if (string.IsNullOrEmpty(name) || name.Length > 24)
            throw new HubException("Invalid display name.");

        var exists = await _db.Sessions.AnyAsync(s => s.JoinCode == code && s.IsActive);
        if (!exists) throw new HubException("Session not found or has ended.");

        await Groups.AddToGroupAsync(Context.ConnectionId, code);
        Context.Items["code"] = code;
        _presence.Add(code, Context.ConnectionId, name);

        await Clients.Group(code).SendAsync("PlayersChanged", _presence.List(code));
    }
    
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        if (Context.Items.TryGetValue("code", out var c) && c is string code)
        {
            _presence.Remove(code, Context.ConnectionId);
            await Clients.Group(code).SendAsync("PlayersChanged", _presence.List(code));
        }
        await base.OnDisconnectedAsync(exception);
    }
}