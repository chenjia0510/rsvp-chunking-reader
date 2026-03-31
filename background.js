chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "read-with-rsvp",
    title: "🚀 Speed Read (RSVP)",
    contexts: ["selection"]
  });
  chrome.contextMenus.create({
    id: "in-page-chunk",
    title: "📖 Chunk In-Page",
    contexts: ["selection"]
  });
});

// Listener for Context Menu
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "read-with-rsvp") {
    chrome.tabs.sendMessage(tab.id, {
      action: "start_rsvp",
      text: info.selectionText
    }).catch(err => console.log("Content script not ready or page restricted."));
  } else if (info.menuItemId === "in-page-chunk") {
    chrome.tabs.sendMessage(tab.id, {
      action: "start_in_page",
      text: info.selectionText
    }).catch(err => console.log("Content script not ready or page restricted."));
  }
});

// Listener for Keyboard Shortcuts
chrome.commands.onCommand.addListener((command) => {
  if (command === "start-rsvp") {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: "get_selection_and_start"
        }).catch(err => console.log("RSVP shortcut failed:", err));
      }
    });
  } else if (command === "in-page-chunk") {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: "get_selection_and_inpage"
        }).catch(err => console.log("In-page shortcut failed:", err));
      }
    });
  }
});
