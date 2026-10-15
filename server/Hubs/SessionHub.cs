using System.Reflection.Metadata;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

public class SessionHub : Hub
{
    private readonly ScribeDbContext _db;
    private readonly PresenceTracker _presence;

    private const double MapWidth = 1000;
    private const double MapHeight = 1000;
    private const int MaxLabelLength = 24;

    public SessionHub(ScribeDbContext db, PresenceTracker presence)
    {
        _db = db;
        _presence = presence;
    }

    public async Task JoinSession(string code, string displayName, string? gmToken)
    {
        var name = displayName?.Trim();
        if (string.IsNullOrEmpty(name) || name.Length > 24)
            throw new HubException("Invalid display name.");

        
        var session = await _db.Sessions.FirstOrDefaultAsync(s => s.JoinCode == code && s.IsActive);
        if (session is null) throw new HubException("Session not found or has ended.");
        
        bool isGm = !string.IsNullOrEmpty(gmToken) && gmToken == session.GmToken;

        await Groups.AddToGroupAsync(Context.ConnectionId, code);

        Context.Items["code"] = code;
        Context.Items["sessionId"] = session.SessionId;
        Context.Items["isGm"] = isGm;

        _presence.Add(code, Context.ConnectionId, name);
        await Clients.Group(code).SendAsync("PlayersChanged", _presence.List(code));
    }

    public async Task PlaceToken(double x, double y, string label, string color)
    {
        var session = await RequireGmSessionAsync();

        if (!ValidatePosition(x, y))
            throw new HubException("Position is outside of the map bounds.");
        
        if (!ValidateHexColor(color))
            throw new HubException("Color is not a valid hex value.");

        string trimmedLabel = ValidateLabel(label);

        // Create new token in db
        Token newToken = new Token
        {
            SessionId = session.SessionId,
            Label = trimmedLabel,
            Color = color.ToLower(),
            X = x,
            Y = y
        };

        _db.Tokens.Add(newToken);
        await _db.SaveChangesAsync();

        // Broadcast new token to group
        await Clients.Group(session.JoinCode).SendAsync("TokenPlaced", newToken);
    }

    public async Task MoveToken(int tokenId, double x, double y)
    {
        var session = await RequireGmSessionAsync();

        if (!ValidatePosition(x, y))
            throw new HubException("Position is outside of the map bounds.");

        // Get token, modify its position, save to db, broadcast
        var token = await _db.Tokens.FirstOrDefaultAsync(t => t.TokenId == tokenId && t.SessionId == session.SessionId);
        if(token is null)
            throw new HubException("Token not found.");

        token.X = x;
        token.Y = y;

        await _db.SaveChangesAsync();
        
        await Clients.Group(session.JoinCode).SendAsync("TokenMoved", token);
    }

    public async Task RemoveToken(int tokenId)
    {
        var session = await RequireGmSessionAsync();

        // Get token, modify its position, save to db, broadcast
        var token = await _db.Tokens.FirstOrDefaultAsync(t => t.TokenId == tokenId && t.SessionId == session.SessionId);
        if(token is null)
            throw new HubException("Token not found.");

        _db.Tokens.Remove(token);
        await _db.SaveChangesAsync();
        
        await Clients.Group(session.JoinCode).SendAsync("TokenRemoved", tokenId);
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

    private async Task<Session> RequireGmSessionAsync()
    {
        // Validate GM
        if (!Context.Items.TryGetValue("isGm", out var gm) || gm is not true)
            throw new HubException("Only the GM can do that.");

        // Guard to prevent calling before actually joining a session
        if (!Context.Items.TryGetValue("code", out var c) || c is not string code)
            throw new HubException("You haven't joined a session.");

        // Validate session
        var session = await _db.Sessions.FirstOrDefaultAsync(s => s.JoinCode == code && s.IsActive);
        if (session is null)
            throw new HubException("Session not found or has ended.");

        return session;
    }

    private bool ValidatePosition(double x, double y)
    {
        return x > 0 && x < MapWidth && y > 0 && y < MapHeight;
    }

    private bool ValidateHexColor(string color)
    {
        if (string.IsNullOrEmpty(color)) return false;

        // Found this regex snippet online
        Regex HexColorRegex = new Regex(@"^#([A-Fa-f0-9]{6})$", RegexOptions.Compiled);

        return HexColorRegex.IsMatch(color);
    }

    private string ValidateLabel(string label)
    {
        var trimmed = label?.Trim();

        if (string.IsNullOrEmpty(trimmed))
            throw new HubException("Token label can't be empty.");

        if (trimmed.Length > MaxLabelLength)
            throw new HubException($"Token label must be {MaxLabelLength} characters or fewer.");

        return trimmed;
    }
}