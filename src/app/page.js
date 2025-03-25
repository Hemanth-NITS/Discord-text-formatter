"use client";

import React, { useRef, useState, useEffect } from "react";
import { Container, Title, Text, Button, Group, Tooltip } from "@mantine/core";
import { notifications } from "@mantine/notifications";

const tooltipTexts = {
  30: "Dark Gray (33%)",
  31: "Red",
  32: "Yellowish Green",
  33: "Gold",
  34: "Light Blue",
  35: "Pink",
  36: "Teal",
  37: "White",
  40: "Blueish Black",
  41: "Rust Brown",
  42: "Gray (40%)",
  43: "Gray (45%)",
  44: "Light Gray (55%)",
  45: "Blurple",
  46: "Light Gray (60%)",
  47: "Cream White",
};

export default function HomePage() {
  const textareaRef = useRef(null);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Save the current text content for undo/redo
  const updateHistory = () => {
    if (textareaRef.current) {
      const content = textareaRef.current.innerHTML;
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(content);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  };

  const handleInput = () => {
    updateHistory();
  };

  // Wrap the selected text in a span with ANSI classes
  const applyStyle = (ansiCode) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    if (range.collapsed) return;

    const span = document.createElement("span");
    span.innerText = selection.toString();
    span.className = `ansi-${ansiCode}`;
    range.deleteContents();
    range.insertNode(span);

    // Reselect the newly inserted span
    selection.removeAllRanges();
    const newRange = document.createRange();
    newRange.selectNodeContents(span);
    selection.addRange(newRange);

    updateHistory();
  };

  // Reset all formatting (remove spans)
  const resetAll = () => {
    if (textareaRef.current) {
      textareaRef.current.innerHTML = textareaRef.current.innerText;
      updateHistory();
    }
  };

  // Undo last change
  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      textareaRef.current.innerHTML = history[newIndex];
      setHistoryIndex(newIndex);
    }
  };

  // Redo last undone change
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      textareaRef.current.innerHTML = history[newIndex];
      setHistoryIndex(newIndex);
    }
  };

  // Convert DOM nodes to ANSI text recursively
  const nodesToANSI = (nodes, states) => {
    let text = "";
    for (const node of nodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        text += node.textContent;
      } else if (node.nodeName === "BR") {
        text += "\n";
      } else {
        // Use a fallback to an empty string if className is undefined.
        const classList = (node.className || "").split(" ");
        const ansiClass = classList.find((cls) => cls.startsWith("ansi-"));
        const ansiCode = ansiClass ? parseInt(ansiClass.split("-")[1]) : null;
        let newState = { ...states[states.length - 1] };
        if (ansiCode !== null) {
          if (ansiCode < 30) newState.st = ansiCode;
          if (ansiCode >= 30 && ansiCode < 40) newState.fg = ansiCode;
          if (ansiCode >= 40) newState.bg = ansiCode;
        }
        states.push(newState);
        text += `\x1b[${newState.st};${
          ansiCode >= 40 ? newState.bg : newState.fg
        }m`;
        text += nodesToANSI(Array.from(node.childNodes), states);
        states.pop();
        text += `\x1b[0m`;
        const prevState = states[states.length - 1];
        if (prevState.fg !== 2) text += `\x1b[${prevState.st};${prevState.fg}m`;
        if (prevState.bg !== 2) text += `\x1b[${prevState.st};${prevState.bg}m`;
      }
    }
    return text;
  };

  // Copy ANSI text to clipboard
  const handleCopy = () => {
    if (!textareaRef.current) return;
    const ansiText =
      "```ansi\n" +
      nodesToANSI(Array.from(textareaRef.current.childNodes), [
        { fg: 2, bg: 2, st: 2 },
      ]) +
      "\n```";
    navigator.clipboard
      .writeText(ansiText)
      .then(() => {
        notifications.show({
          title: "Copied!",
          message: "ANSI formatted text has been copied.",
          color: "green",
          autoClose: 5000,
          position: "top-right",
        });
      })
      .catch(() => {
        notifications.show({
          title: "Error",
          message: "Copying failed. Please try manually.",
          color: "red",
          autoClose: 5000,
          position: "top-right",
        });
      });
  };

  // Export ANSI text as a file
  const handleExport = () => {
    if (!textareaRef.current) return;
    const ansiText =
      "```ansi\n" +
      nodesToANSI(Array.from(textareaRef.current.childNodes), [
        { fg: 2, bg: 2, st: 2 },
      ]) +
      "\n```";
    const blob = new Blob([ansiText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = "discord-ansi.txt";
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    notifications.show({
      title: "Exported",
      message: "ANSI formatted text file has been downloaded.",
      color: "blue",
      autoClose: 5000,
      position: "top-right",
    });
  };

  // Advanced feature (formatting) buttons
  const formattingButtons = [
    { label: "Bold", ansi: "1", onClick: () => applyStyle("1") },
    { label: "Italic", ansi: "3", onClick: () => applyStyle("3") },
    { label: "Underline", ansi: "4", onClick: () => applyStyle("4") },
    { label: "Strike", ansi: "9", onClick: () => applyStyle("9") },
    { label: "Undo", onClick: handleUndo },
    { label: "Redo", onClick: handleRedo },
    { label: "Reset All", onClick: resetAll },
  ];

  // Color buttons
  const fgButtons = ["30", "31", "32", "33", "34", "35", "36", "37"];
  const bgButtons = ["40", "41", "42", "43", "44", "45", "46", "47"];

  useEffect(() => {
    if (textareaRef.current) {
      updateHistory();
    }
  }, []);

  return (
    <Container
      style={{
        padding: 20,
        backgroundColor: "#36393F",
        color: "#FFF",
        minHeight: "100vh",
      }}
    >
      <Title align="center" order={1}>
        Hemanth's Discord <span style={{ color: "#5865F2" }}>Text</span> Formatter
      </Title>
      <Text align="center" mt={10}>
        Format your text with ANSI codes.
      </Text>
      <Text align="center" mt={10}>
      You can Add color, backgroundColor to text, you can also make text bold, italic, underline, strike.
      </Text>
      <Text align="center" mt={10}>
        You can also undo, redo, reset all formatting.
      </Text>

      {/* 
        1)single container(no border)that includes:
           - FG color section
           - BG color section
      */}
      <div
        style={{
          marginTop: 20,
          width: 600,
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        {/* FG Section */}
        <Text size="md" weight={600} mb={5}>
          FG:
        </Text>
        <div
          style={{
            minHeight: 80,
            padding: 10,
            backgroundColor: "transparent",
          }}
        >
          <Group spacing="md" position="center">
            {fgButtons.map((code, idx) => (
              <Tooltip key={idx} label={tooltipTexts[code]} withArrow>
                <Button
                  size="xs"
                  onClick={() => applyStyle(code)}
                  style={{
                    backgroundColor:
                      code === "30"
                        ? "#4f545c"
                        : code === "31"
                        ? "#dc322f"
                        : code === "32"
                        ? "#859900"
                        : code === "33"
                        ? "#b58900"
                        : code === "34"
                        ? "#268bd2"
                        : code === "35"
                        ? "#d33682"
                        : code === "36"
                        ? "#2aa198"
                        : "#ffffff",
                    minWidth: 24,
                    minHeight: 24,
                  }}
                >
                  &nbsp;
                </Button>
              </Tooltip>
            ))}
          </Group>
        </div>

        {/* BG Section */}
        <Text size="md" weight={600} mt={20} mb={5}>
          BG:
        </Text>
        <div
          style={{
            minHeight: 80,
            padding: 10,
            backgroundColor: "transparent",
          }}
        >
          <Group spacing="md" position="center">
            {bgButtons.map((code, idx) => (
              <Tooltip key={idx} label={tooltipTexts[code]} withArrow>
                <Button
                  size="xs"
                  onClick={() => applyStyle(code)}
                  style={{
                    backgroundColor:
                      code === "40"
                        ? "#002b36"
                        : code === "41"
                        ? "#cb4b16"
                        : code === "42"
                        ? "#586e75"
                        : code === "43"
                        ? "#657b83"
                        : code === "44"
                        ? "#839496"
                        : code === "45"
                        ? "#6c71c4"
                        : code === "46"
                        ? "#93a1a1"
                        : "#fdf6e3",
                    color: "#fff",
                    minWidth: 24,
                    minHeight: 24,
                  }}
                >
                  &nbsp;
                </Button>
              </Tooltip>
            ))}
          </Group>
        </div>
      </div>


      <div
        style={{
          marginTop: 20,
          width: 600,
          marginLeft: "auto",
          marginRight: "auto",
          backgroundColor: "transparent",
        }}
      >
  
        <div
          style={{
            width: 600,
            margin: "0 auto 10px auto",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          {formattingButtons.map((btn, idx) => (
            <Button
              key={idx}
              size="xs"
              variant="light"
              color="blue"
              onClick={btn.onClick}
            >
              {btn.label}
            </Button>
          ))}
        </div>


        <div
          ref={textareaRef}
          contentEditable
          onInput={handleInput}
          suppressContentEditableWarning
          style={{
            resize: "both",
            overflow: "auto",
            backgroundColor: "#2F3136",
            width: "100%",
            height: 200,
            padding: 10,
            color: "#B9BBBE",
            fontFamily: "monospace",
            whiteSpace: "pre-wrap",
            outline: "none",
          }}
        >
          Welcome to <span className="ansi-33">Rebane</span>'s{" "}
          <span className="ansi-45">
            <span className="ansi-37">Discord</span>
          </span>{" "}
          <span className="ansi-31">C</span>
          <span className="ansi-32">o</span>
          <span className="ansi-33">l</span>
          <span className="ansi-34">o</span>
          <span className="ansi-35">r</span>
          <span className="ansi-36">e</span>
          <span className="ansi-37">d</span> Text Generator!
        </div>

        <Group spacing="md" position="center" style={{ marginTop: 10 }}>
          <Button onClick={handleCopy}>Copy ANSI Text</Button>
          <Button onClick={handleExport} variant="outline">
            Export to File
          </Button>
        </Group>
      </div>

      <Text align="center" mt={20} size="xs">
        This is not an offical/unofficial tool owned by discord.
      </Text>
    </Container>
  );
}
