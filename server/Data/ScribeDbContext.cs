using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

public class ScribeDbContext : DbContext
{
    public DbSet<Session> Sessions { get; set; }
    public DbSet<Character> Characters { get; set; }
    public DbSet<Token> Tokens { get; set; }
    public DbSet<ChatMessage> ChatMessages { get; set; }
    public string DbPath { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        /* 
            This snippet allows us to store character inventory ids as a list.
            It first serializes it into json for the db, then when recieved from the db, deserializes it into a list. 
        */
        modelBuilder.Entity<Character>()
            .Property(c => c.InventoryIds)
            .HasConversion(
                v => JsonSerializer.Serialize(v),
                v => JsonSerializer.Deserialize<List<int>>(v) ?? new List<int>()
            );
    }

    protected override void OnConfiguring(DbContextOptionsBuilder options)
    {
        /*
            By using the HOME environment variable instead of the local
            data application folder, it allows us to later use our db on Azure when we deploy.
        */
        var home = Environment.GetEnvironmentVariable("HOME"); 
        var basePath = home ?? Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
        var dataDir = Path.Join(basePath, "data");
        Directory.CreateDirectory(dataDir);
        DbPath = Path.Join(basePath, "data", "scribe.db");
        options.UseSqlite($"Data Source={DbPath}");
    }
}

public class Session
{
    public int SessionId { get; set; }
    public string JoinCode { get; set; }
    public int GameMasterId { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class Character
{
    public int CharacterId { get; set; }
    public int SessionId { get; set; }
    public string OwnerName { get; set; }
    public string Name { get; set; }
    public int HitPoints { get; set; }
    public int ArmorClass { get; set; }
    public int Strength { get; set; }
    public int Dexterity { get; set; }
    public int Constitution { get; set; }
    public int Intelligence { get; set; }
    public int Wisdom { get; set; }
    public int Charisma { get; set; }
    public int ClassId { get; set; }
    public List<int> InventoryIds { get; set; }
}

public class Token
{
    public int TokenId { get; set; }
    public int SessionId { get; set; }
    public int? CharacterId { get; set; }
    public double X { get; set; }
    public double Y { get; set; }
    public int MapId { get; set; }
}

public class ChatMessage
{
    public int ChatMessageId { get; set; }
    public int SessionId { get; set; }
    public string SenderName { get; set; }
    public string Content { get; set; }
    public DateTime TimeStamp { get; set; }
    public bool IsRollResult { get; set; }
}