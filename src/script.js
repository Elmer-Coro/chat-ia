import { CreateWebWorkerMLCEngine } from "https://esm.run/@mlc-ai/web-llm";

const $form = document.querySelector("form");
const $input = document.querySelector("input");
const $template = document.querySelector("#message-template");
const $messages = document.querySelector("ul");
const $container = document.querySelector("main");
const $button = document.querySelector("button");
const $info = document.querySelector("small");

let messages = [];

const SLECTED_MODEL = "TinyLlama-1.1B-Chat-v0.4-q4f32_1-MLC-1k";

const engine = await CreateWebWorkerMLCEngine(
  new Worker("/src/worker.js", { type: "module" }),
  SLECTED_MODEL,
  {
    initProgressCallback: (info) => {
      console.log(info);
      $info.textContent = `${info.text}%`;
      if (info.progress === 1) {
        $button.removeAttribute("disable");
      }
    },
  }
);

$form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const messageText = $input.value.trim();

  if (messageText !== "") {
    $input.value = "";
  }

  addMessage(messageText, "user");
  $button.setAttribute("disabled", "");

  const userMessage = {
    role: "user",
    content: messageText,
  };

  messages.push(userMessage);

  const chunks = await engine.chat.completions.create({
    messages,
    stream: true,
  });

  let reply = "";

  const $botMessage = addMessage("", "bot");

  for await (const chunk of chunks) {
    const choice = chunk.choices[0];
    const content = choice?.delta?.content ?? "";
    reply += content;
    $botMessage.textContent = reply;
  }

  $button.removeAttribute("disabled");

  messages.push({
    role: "assistant",
    content: reply,
  });
  $container.scrollTop = $container.scrollHeight;
});

function addMessage(text, sender) {
  const clonedTemplate = $template.content.cloneNode(true);
  const $newMessage = clonedTemplate.querySelector(".message");

  const $who = $newMessage.querySelector("span");
  const $text = $newMessage.querySelector("p");

  $text.textContent = text;
  $who.textContent = sender === "bot" ? "GPT" : "Tú";
  $newMessage.classList.add(sender);

  $messages.appendChild($newMessage);
  $container.scrollTop = $container.scrollHeight;

  return $text;
}
