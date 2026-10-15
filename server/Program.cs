using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<ScribeDbContext>();
builder.Services.AddSignalR();

// Setup CORS (Allows the dev frontend to interact with the server because they exist on different ports, i.e., different origins.)
builder.Services.AddCors(options =>
{
    options.AddPolicy(name: "ClientDev",
                      policy  =>
                      {
                          policy.WithOrigins("http://localhost:5173")
                            .AllowAnyHeader()
                            .AllowAnyMethod()
                            .AllowCredentials();
                      });
});

builder.Services.AddSingleton<PresenceTracker>();

var app = builder.Build();
app.UseCors("ClientDev");
app.MapHub<SessionHub>("/hubs/session");
app.UseHttpsRedirection();

#region SessionEndpoints

app.MapPost("/api/sessions", async (ScribeDbContext db) =>
{
    Session session = new Session
    {
        JoinCode = GenerateJoinCode(),
        GameMasterId = 0,
        GmToken = Guid.NewGuid().ToString("N"), // Using N formats the GUID without hyphens
        IsActive = true,
        CreatedAt = DateTime.UtcNow
    };

    db.Sessions.Add(session);
    await db.SaveChangesAsync();

    return Results.Created($"/api/sessions/{session.JoinCode}", new {session.GmToken, session.JoinCode});
});

app.MapGet("/api/sessions/{code}", async (string code, ScribeDbContext db) =>
{
    var session = await db.Sessions.FirstOrDefaultAsync(s => s.JoinCode == code);

    if (session is null)
        return Results.NotFound(new { error = "Session not found."});
    
    if (!session.IsActive)
        return Results.Conflict(new {error = "Session is not active."});

    SessionResponse response = new(session.JoinCode, session.IsActive);
    return Results.Ok(response);
});

app.MapPost("/api/sessions/{code}/join", async (string code, ScribeDbContext db) =>
{
    var session = await db.Sessions.FirstOrDefaultAsync(s => s.JoinCode == code);

    if (session is null)
        return Results.NotFound(new { error = "Session not found."});
    
    if (!session.IsActive)
        return Results.Conflict(new {error = "Session is not active."});

    SessionResponse response = new(session.JoinCode, session.IsActive);
    return Results.Ok(response);
});

app.MapPost("/api/sessions/{code}/end", async (string code, ScribeDbContext db) =>
{
    var session = await db.Sessions.FirstOrDefaultAsync(s => s.JoinCode == code);

    if (session is null)
        return Results.NotFound(new { error = "Session not found."});

    session.IsActive = false;
    await db.SaveChangesAsync();
    return Results.NoContent();
});

#endregion

#region TokenEndpoints

app.MapGet("/api/sessions/{code}/tokens", async (string code, ScribeDbContext db) =>
{
    var session = await db.Sessions.FirstOrDefaultAsync(s => s.JoinCode == code);

    if (session is null)
        return Results.NotFound(new { error = "Session not found."});

    if (!session.IsActive)
        return Results.Conflict(new {error = "Session is not active."});

    /* 
        Using AsNoTracking disables EFCore's entity tracking reducing the overhead. 
        We don't need it because we aren't going to be making any changes to the tokens from here. 
    */
    var tokens = await db.Tokens.AsNoTracking().Where(t => t.SessionId == session.SessionId).ToListAsync();
    return Results.Ok(tokens);
});

#endregion

#region Helpers

static string GenerateJoinCode()
{
    const string codeChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789";
    var rng = Random.Shared;
    return new(Enumerable.Range(0, 6).Select(_ => codeChars[rng.Next(codeChars.Length)]).ToArray());
}

#endregion

app.Run();

