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


var app = builder.Build();
app.UseCors("ClientDev");
app.MapHub<SessionHub>("/hubs/session");
app.UseHttpsRedirection();

app.MapPost("/api/sessions", async (ScribeDbContext db) =>
{
    Session session = new Session
    {
        JoinCode = GenerateJoinCode(),
        GameMasterId = 0,
        IsActive = true,
        CreatedAt = DateTime.UtcNow
    };

    db.Sessions.Add(session);
    await db.SaveChangesAsync();
    return Results.Created($"/api/sessions/{session.JoinCode}", session);
});

app.MapGet("/api/sessions/{code}", async (string code, ScribeDbContext db) =>
{
    var session = await db.Sessions.FirstOrDefaultAsync(s => s.JoinCode == code);

    if (session is null)
        return Results.NotFound(new { error = "Session not found."});
    
    if (!session.IsActive)
        return Results.Conflict(new {error = "Session is not active."});

    // TODO: Player lists will have to be updated here once implemented.

    return Results.Ok(session);
});

app.MapPost("/api/sessions/{code}/join", async (string code, ScribeDbContext db) =>
{
    var session = await db.Sessions.FirstOrDefaultAsync(s => s.JoinCode == code);

    if (session is null)
        return Results.NotFound(new { error = "Session not found."});
    
    if (!session.IsActive)
        return Results.Conflict(new {error = "Session is not active."});

    // TODO: Player lists will have to be updated here once implemented.

    return Results.Ok(session);
});

app.MapPost("/api/sessions/{code}/end", async (string code, ScribeDbContext db) =>
{
    var session = await db.Sessions.FirstOrDefaultAsync(s => s.JoinCode == code);

    if (session is null)
        return Results.NotFound();

    session.IsActive = false;
    await db.SaveChangesAsync();
    return Results.NoContent();
});


static string GenerateJoinCode()
{
    const string codeChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789";
    var rng = Random.Shared;
    return new(Enumerable.Range(0, 6).Select(_ => codeChars[rng.Next(codeChars.Length)]).ToArray());
}

app.Run();

