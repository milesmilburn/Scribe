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
app.Run();

