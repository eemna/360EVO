import { prisma } from "../config/prisma.js";
import {
  createDocumentRiskScan,
  suggestQaAnswer,
  createDealBrief,
} from "../services/ddLlmService.js";
import crypto from "crypto";
import {
  getDocument,
  GlobalWorkerOptions,
} from "pdfjs-dist/legacy/build/pdf.mjs";
import { fileURLToPath, pathToFileURL } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

GlobalWorkerOptions.workerSrc = pathToFileURL(
  join(__dirname, "../node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs"),
).href;
async function extractTextFromPdf(buffer) {
  const uint8 = new Uint8Array(buffer);
  const pdf = await getDocument({
    data: uint8,
    useWorkerFetch: false,
    isEvalSupported: false,
    useSystemFonts: true,
  }).promise;

  let fullText = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .filter((item) => "str" in item)
      .map((item) => item.str)
      .join(" ");
    fullText += pageText + "\n";
  }

  return fullText;
}
// DD REQUESTS

// POST /api/dd-requests
export const requestDueDiligence = async (req, res, next) => {
  try {
    const investorId = req.user.id;
    const { projectId, message, nda } = req.body;

    if (!projectId) {
      return res.status(400).json({ message: "projectId is required" });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, ownerId: true, title: true, status: true },
    });

    if (!project || project.status !== "APPROVED") {
      return res
        .status(404)
        .json({ message: "Project not found or not approved" });
    }

    // @@unique prevents duplicates automatically
    const ddRequest = await prisma.ddRequest.create({
      data: { projectId, investorId, message, nda: nda || false },
    });

    // Notify project owner
    await prisma.notification.create({
      data: {
        userId: project.ownerId,
        type: "SYSTEM",
        title: "New Due Diligence Request",
        body: `An investor requested due diligence access for "${project.title}"`,
        link: `/app/startup/dd-requests`,
      },
    });

    res.status(201).json(ddRequest);
  } catch (error) {
    // Handle duplicate request (@@unique violation)
    if (error.code === "P2002") {
      return res
        .status(400)
        .json({ message: "You already sent a DD request for this project" });
    }
    next(error);
  }
};

// GET /api/dd-requests/received  (startup sees requests for their projects)
// GET /api/dd-requests/sent      (investor sees their own requests)
export const getDdRequests = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { type } = req.params; // "received" or "sent"

    if (type === "received") {
      // Startup: find requests for projects they own
      const requests = await prisma.ddRequest.findMany({
        where: { project: { ownerId: userId } },
        include: {
          investor: { select: { name: true, email: true, profile: true } },
          project: { select: { id: true, title: true } },
          dataRoom: { select: { id: true, expiresAt: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      return res.json(requests);
    }

    // Investor: their own sent requests
    const requests = await prisma.ddRequest.findMany({
      where: { investorId: userId },
      include: {
        project: {
          select: { id: true, title: true, owner: { select: { name: true } } },
        },
        dataRoom: { select: { id: true, expiresAt: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(requests);
  } catch (error) {
    next(error);
  }
};

// PUT /api/dd-requests/:id/approve
export const approveDdRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const ddRequest = await prisma.ddRequest.findUnique({
      where: { id },
      include: { project: { select: { ownerId: true, title: true } } },
    });

    if (!ddRequest)
      return res.status(404).json({ message: "Request not found" });
    if (ddRequest.project.ownerId !== userId)
      return res.status(403).json({ message: "Forbidden" });
    if (ddRequest.status !== "PENDING")
      return res.status(400).json({ message: "Request already processed" });

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.ddRequest.update({
        where: { id },
        data: { status: "APPROVED", reviewedAt: new Date() },
      });

      const dataRoom = await tx.dataRoom.create({
        data: {
          ddRequestId: id,
          projectId: ddRequest.projectId,
          investorId: ddRequest.investorId,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      await tx.notification.create({
        data: {
          userId: ddRequest.investorId,
          type: "SYSTEM",
          title: "DD Request Approved",
          body: `Your due diligence request for "${ddRequest.project.title}" was approved. You now have 30 days of access.`,
          link: `/app/investor/data-rooms/${dataRoom.id}`,
        },
      });

      return { updated, dataRoom };
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// PUT /api/dd-requests/:id/decline
export const declineDdRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const ddRequest = await prisma.ddRequest.findUnique({
      where: { id },
      include: { project: { select: { ownerId: true, title: true } } },
    });

    if (!ddRequest)
      return res.status(404).json({ message: "Request not found" });
    if (ddRequest.project.ownerId !== userId)
      return res.status(403).json({ message: "Forbidden" });

    await prisma.ddRequest.update({
      where: { id },
      data: { status: "DECLINED", reviewedAt: new Date() },
    });

    await prisma.notification.create({
      data: {
        userId: ddRequest.investorId,
        type: "SYSTEM",
        title: "DD Request Declined",
        body: `Your due diligence request for "${ddRequest.project.title}" was declined.`,
      },
    });

    res.json({ message: "Request declined" });
  } catch (error) {
    next(error);
  }
};

// DATA ROOM

// Helper — checks access + expiry, returns dataRoom or throws
async function getAccessibleDataRoom(dataRoomId, userId) {
  const dataRoom = await prisma.dataRoom.findUnique({
    where: { id: dataRoomId },
    include: {
      project: { select: { ownerId: true, title: true } },
    },
  });

  if (!dataRoom) throw { status: 404, message: "Data room not found" };

  const isInvestor = dataRoom.investorId === userId;
  const isOwner = dataRoom.project.ownerId === userId;

  if (!isInvestor && !isOwner) throw { status: 403, message: "Access denied" };
  if (Date.now() > dataRoom.expiresAt.getTime())
    throw { status: 403, message: "Data room has expired" };

  return { dataRoom, isInvestor, isOwner };
}

// GET /api/data-rooms/:id
export const getDataRoom = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { isInvestor, isOwner } = await getAccessibleDataRoom(id, userId);

    const full = await prisma.dataRoom.findUnique({
      where: { id },
      include: {
        documents: true,
        qaThreads: {
          include: {
            asker: { select: { name: true, role: true } },
            responses: {
              include: { responder: { select: { name: true, role: true } } },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        activity: {
          orderBy: { createdAt: "desc" },
          take: 20,
          include: { user: { select: { name: true } } },
        },
        project: { select: { title: true, ownerId: true } },
        dealBrief: true,
      },
    });

    // Log activity
    await prisma.dataRoomActivity.create({
      data: { dataRoomId: id, userId, action: "VIEWED_ROOM" },
    });

    const visibleDocs = full.documents.filter(
      (d) => d.accessLevel === "OPEN" || isOwner,
    );
    res.json({ ...full, documents: visibleDocs, isInvestor, isOwner });
  } catch (error) {
    if (error.status)
      return res.status(error.status).json({ message: error.message });
    next(error);
  }
};

// POST /api/data-rooms/:id/documents
export const addDocument = async (req, res, next) => {
  try {
    const { id: dataRoomId } = req.params;
    const userId = req.user.id;
    const { name, fileUrl, fileKey, fileType, accessLevel } = req.body;

    const { isOwner } = await getAccessibleDataRoom(dataRoomId, userId);
    if (!isOwner)
      return res
        .status(403)
        .json({ message: "Only the startup can upload documents" });

    // Extract text from PDF for AI features
    let textExtract = null;
    if (fileType === "application/pdf" && fileUrl) {
      try {
        const response = await fetch(fileUrl);
        const buffer = Buffer.from(await response.arrayBuffer());
        console.log("[DD] Buffer size:", buffer.length);
        const text = await extractTextFromPdf(buffer);
        console.log("[DD] Raw text length:", text.length);
        console.log("[DD] Raw text sample:", text.slice(0, 200));
        textExtract = text.slice(0, 50000);
        console.log(`[DD] Extracted ${textExtract.length} chars from ${name}`);
      } catch (err) {
        console.warn(`[DD] PDF extraction failed for ${name}:`, err.message);
        console.warn(`[DD] Full error:`, err);
      }
    }

    const doc = await prisma.dataRoomDocument.create({
      data: {
        dataRoomId,
        name,
        fileUrl,
        fileKey,
        fileType,
        accessLevel: accessLevel || "OPEN",
        textExtract,
      },
    });

    // Log activity
    await prisma.dataRoomActivity.create({
      data: { dataRoomId, userId, action: "UPLOADED_DOCUMENT", docName: name },
    });

    // Reset aiSummaryGenerated so the scan runs again with new docs
    await prisma.dataRoom.update({
      where: { id: dataRoomId },
      data: { aiSummaryGenerated: false },
    });

    res.status(201).json(doc);
  } catch (error) {
    if (error.status)
      return res.status(error.status).json({ message: error.message });
    next(error);
  }
};

// DELETE /api/data-rooms/:id/documents/:docId
export const deleteDocument = async (req, res, next) => {
  try {
    const { id: dataRoomId, docId } = req.params;
    const userId = req.user.id;

    const { isOwner } = await getAccessibleDataRoom(dataRoomId, userId);
    if (!isOwner) return res.status(403).json({ message: "Forbidden" });

    await prisma.dataRoomDocument.delete({ where: { id: docId } });

    await prisma.dataRoomActivity.create({
      data: { dataRoomId, userId, action: "DELETED_DOCUMENT" },
    });

    res.json({ message: "Document deleted" });
  } catch (error) {
    if (error.status)
      return res.status(error.status).json({ message: error.message });
    next(error);
  }
};
// PUT /api/data-rooms/:id/documents/:docId  (update accessLevel)
export const updateDocumentAccess = async (req, res, next) => {
  try {
    const { id: dataRoomId, docId } = req.params;
    const userId = req.user.id;
    const { accessLevel } = req.body;

    const { isOwner } = await getAccessibleDataRoom(dataRoomId, userId);
    if (!isOwner) return res.status(403).json({ message: "Forbidden" });

    if (!["OPEN", "ON_REQUEST"].includes(accessLevel)) {
      return res
        .status(400)
        .json({ message: "Invalid accessLevel. Use OPEN or ON_REQUEST" });
    }

    const doc = await prisma.dataRoomDocument.update({
      where: { id: docId },
      data: { accessLevel },
    });

    await prisma.dataRoomActivity.create({
      data: {
        dataRoomId,
        userId,
        action: "UPDATED_DOCUMENT_ACCESS",
        docName: doc.name,
      },
    });

    res.json(doc);
  } catch (error) {
    if (error.status)
      return res.status(error.status).json({ message: error.message });
    next(error);
  }
};
// Q&A

// POST /api/data-rooms/:id/qa
export const createQaThread = async (req, res, next) => {
  try {
    const { id: dataRoomId } = req.params;
    const askerId = req.user.id;
    const { question } = req.body;

    const { dataRoom, isInvestor } = await getAccessibleDataRoom(
      dataRoomId,
      askerId,
    );
    if (!isInvestor)
      return res
        .status(403)
        .json({ message: "Only investors can ask questions" });

    const thread = await prisma.ddQaThread.create({
      data: { dataRoomId, question, askerId },
      include: {
        asker: { select: { name: true, role: true } },
        responses: true,
      },
    });

    // Notify startup owner
    await prisma.notification.create({
      data: {
        userId: dataRoom.project.ownerId,
        type: "SYSTEM",
        title: "New DD Question",
        body: `An investor asked: "${question.slice(0, 80)}..."`,
        link: `/app/startup/data-rooms/${dataRoomId}`,
      },
    });

    // Emit via Socket.io
    if (global.io) {
      global.io.to(`dataroom_${dataRoomId}`).emit("new_qa_thread", thread);
    }

    res.status(201).json(thread);
  } catch (error) {
    if (error.status)
      return res.status(error.status).json({ message: error.message });
    next(error);
  }
};
// GET /api/data-rooms/:id/qa
export const getQaThreads = async (req, res, next) => {
  try {
    const { id: dataRoomId } = req.params;
    const userId = req.user.id;

    await getAccessibleDataRoom(dataRoomId, userId);

    const threads = await prisma.ddQaThread.findMany({
      where: { dataRoomId },
      include: {
        asker: { select: { name: true, role: true } },
        responses: {
          include: { responder: { select: { name: true, role: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(threads);
  } catch (error) {
    if (error.status)
      return res.status(error.status).json({ message: error.message });
    next(error);
  }
};
// GET /api/data-rooms/:id/activity
export const getActivity = async (req, res, next) => {
  try {
    const { id: dataRoomId } = req.params;
    const userId = req.user.id;

    const { isOwner } = await getAccessibleDataRoom(dataRoomId, userId);
    // Only startup owner sees full activity log
    if (!isOwner) return res.status(403).json({ message: "Forbidden" });

    const activity = await prisma.dataRoomActivity.findMany({
      where: { dataRoomId },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { user: { select: { name: true, role: true } } },
    });

    res.json(activity);
  } catch (error) {
    if (error.status)
      return res.status(error.status).json({ message: error.message });
    next(error);
  }
};
// POST /api/data-rooms/:id/qa/:threadId/reply
export const replyToQaThread = async (req, res, next) => {
  try {
    const { id: dataRoomId, threadId } = req.params;
    const responderId = req.user.id;
    const { body, isAiGenerated } = req.body;

    const { dataRoom, isOwner } = await getAccessibleDataRoom(
      dataRoomId,
      responderId,
    );
    if (!isOwner)
      return res.status(403).json({ message: "Only the startup can reply" });

    const response = await prisma.ddQaResponse.create({
      data: {
        threadId,
        body,
        responderId,
        isAiGenerated: isAiGenerated || false,
      },
      include: { responder: { select: { name: true } } },
    });

    // Notify investor
    await prisma.notification.create({
      data: {
        userId: dataRoom.investorId,
        type: "SYSTEM",
        title: "DD Question Answered",
        body: `Your question has been answered in the data room.`,
        link: `/app/investor/data-rooms/${dataRoomId}`,
      },
    });

    if (global.io) {
      global.io.to(`dataroom_${dataRoomId}`).emit("new_qa_response", {
        threadId,
        response,
      });
    }

    res.status(201).json(response);
  } catch (error) {
    if (error.status)
      return res.status(error.status).json({ message: error.message });
    next(error);
  }
};

// AI FEATURES

// POST /api/data-rooms/:id/ai/scan
export const runAiScan = async (req, res, next) => {
  try {
    const { id: dataRoomId } = req.params;
    const userId = req.user.id;

    const { dataRoom, isInvestor } = await getAccessibleDataRoom(
      dataRoomId,
      userId,
    );
    if (!isInvestor)
      return res
        .status(403)
        .json({ message: "Only investors can trigger the scan" });

    // Always fetch documents to compute hash
    const fullRoom = await prisma.dataRoom.findUnique({
      where: { id: dataRoomId },
      include: {
        documents: {
          where: { accessLevel: "OPEN" },
        },
      },
    });

    // Hash based on document IDs + uploadedAt — changes when docs are added/removed
    const inputHash = crypto
      .createHash("sha256")
      .update(
        fullRoom.documents
          .map((d) => `${d.id}:${d.uploadedAt}`)
          .sort()
          .join(","),
      )
      .digest("hex");

    // Check cache — only valid if hash matches (same documents)
    if (dataRoom.aiSummaryGenerated) {
      const cached = await prisma.llmInsight.findUnique({
        where: {
          investorId_projectId_type: {
            investorId: dataRoom.investorId,
            projectId: dataRoom.projectId,
            type: "DD_SUMMARY",
          },
        },
      });
      // Return cache ONLY if documents haven't changed
      if (cached && cached.inputHash === inputHash) {
        return res.json({ cached: true, data: cached.content });
      }
    }

    // Run fresh scan
    const scan = await createDocumentRiskScan(fullRoom.documents);

    await prisma.llmInsight.upsert({
      where: {
        investorId_projectId_type: {
          investorId: dataRoom.investorId,
          projectId: dataRoom.projectId,
          type: "DD_SUMMARY",
        },
      },
      update: { content: scan, inputHash },
      create: {
        investorId: dataRoom.investorId,
        projectId: dataRoom.projectId,
        type: "DD_SUMMARY",
        content: scan,
        inputHash,
      },
    });

    await prisma.dataRoom.update({
      where: { id: dataRoomId },
      data: { aiSummaryGenerated: true },
    });

    res.json({ cached: false, data: scan });
  } catch (error) {
    if (error.status)
      return res.status(error.status).json({ message: error.message });
    next(error);
  }
};

// POST /api/data-rooms/:id/ai/suggest-answer
export const suggestAnswer = async (req, res, next) => {
  try {
    const { id: dataRoomId } = req.params;
    const userId = req.user.id;
    const { threadId } = req.body;

    const { isOwner } = await getAccessibleDataRoom(dataRoomId, userId);
    if (!isOwner)
      return res
        .status(403)
        .json({ message: "Only the startup can request suggestions" });

    const thread = await prisma.ddQaThread.findUnique({
      where: { id: threadId, dataRoomId },
    });
    if (!thread) return res.status(404).json({ message: "Thread not found" });

    const fullRoom = await prisma.dataRoom.findUnique({
      where: { id: dataRoomId },
      include: { documents: true },
    });

    const suggestion = await suggestQaAnswer(
      thread.question,
      fullRoom.documents,
    );

    // Save to the thread — startup reviews before sending
    await prisma.ddQaThread.update({
      where: { id: threadId },
      data: { aiSuggestedAnswer: suggestion.suggestedAnswer },
    });

    res.json(suggestion);
  } catch (error) {
    if (error.status)
      return res.status(error.status).json({ message: error.message });
    next(error);
  }
};

// POST /api/data-rooms/:id/ai/deal-brief
export const generateDealBrief = async (req, res, next) => {
  try {
    const { id: dataRoomId } = req.params;
    const userId = req.user.id;

    const { dataRoom, isInvestor } = await getAccessibleDataRoom(
      dataRoomId,
      userId,
    );
    if (!isInvestor)
      return res
        .status(403)
        .json({ message: "Only investors can generate deal briefs" });

     const fullRoom = await prisma.dataRoom.findUnique({
      where: { id: dataRoomId },
      include: {
        project: { include: { aiAssessment: true, teamMembers: true ,llmInsights: true, } },
        documents: true,
        
      },
    });

    const investorProfile = await prisma.investorProfile.findUnique({
      where: { userId: dataRoom.investorId },
    });

const riskInsight = await prisma.llmInsight.findUnique({
  where: {
    investorId_projectId_type: {
      investorId: dataRoom.investorId,
      projectId: dataRoom.projectId,
      type: "DD_SUMMARY",
    },
  },
});
    const brief = await createDealBrief(
      fullRoom,
      fullRoom.project,
      fullRoom.project.aiAssessment,
      investorProfile,
      riskInsight?.content 
    );

    const saved = await prisma.aiDealBrief.upsert({
      where: { dataRoomId },
      update: {
        content: brief,
        generatedAt: new Date(),
        version: { increment: 1 },
      },
      create: {
        dataRoomId,
        investorId: dataRoom.investorId,
        content: brief,
      },
    });

    res.json(saved);
  } catch (error) {
    if (error.status)
      return res.status(error.status).json({ message: error.message });
    next(error);
  }
};

// GET /api/data-rooms/:id/ai/deal-brief
export const getDealBrief = async (req, res, next) => {
  try {
    const { id: dataRoomId } = req.params;
    const userId = req.user.id;

    await getAccessibleDataRoom(dataRoomId, userId);

    const brief = await prisma.aiDealBrief.findUnique({
      where: { dataRoomId },
    });
    if (!brief)
      return res.status(404).json({ message: "No deal brief generated yet" });

    res.json(brief);
  } catch (error) {
    if (error.status)
      return res.status(error.status).json({ message: error.message });
    next(error);
  }
};
