using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Scribe.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddGmToken : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "GmToken",
                table: "Sessions",
                type: "TEXT",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "GmToken",
                table: "Sessions");
        }
    }
}
